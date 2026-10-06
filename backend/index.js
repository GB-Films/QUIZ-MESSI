import { orderedQuestions } from '../dist/questions.js';

export const VERSION = 'argentina-survival-1';
const ORIGINS = new Set(['https://gb-films.github.io','http://127.0.0.1:4173','http://localhost:4173']);
const TIME = 10000;
const uuidPattern = /^[a-f0-9-]{36}$/i;
const query = (db, sql, values = []) => db.prepare(sql).bind(...values);
const digest = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
function fail(message, status = 400) { throw Object.assign(new Error(message), {status}); }
function cleanName(value) {
  if (typeof value !== 'string') fail('Escribí tu nombre para el ranking.');
  const name = value.normalize('NFC').trim().replace(/\s+/g,' ');
  if (name.length < 2 || name.length > 20 || /[<>\p{Cc}\p{Cf}]/u.test(name)) fail('Usá un nombre de 2 a 20 caracteres.');
  return name;
}
async function leaderboard(db) {
  const {results} = await query(db, 'SELECT public_id AS id, nickname, avatar, score, elapsed_ms AS elapsedMs FROM quiz_players WHERE version=? AND score>=0 ORDER BY score DESC, elapsed_ms ASC, updated_at ASC LIMIT 5', [VERSION]).all();
  const count = await query(db,'SELECT COUNT(*) AS n FROM quiz_players WHERE version=? AND score>=0',[VERSION]).first();
  return {entries:results,total:count.n};
}
async function result(db, game) {
  // Cada jugador ocupa una sola fila: se conserva su mejor partida.
  await query(db, `UPDATE quiz_players SET nickname=?, avatar=?, score=?, elapsed_ms=?, updated_at=?
    WHERE token_hash=? AND version=? AND (score<? OR (score=? AND elapsed_ms>?))`,
    [game.nickname,game.avatar,game.score,game.elapsed_ms,game.finished_at,game.player_hash,VERSION,game.score,game.score,game.elapsed_ms]).run();
  const player = await query(db,'SELECT public_id, score, elapsed_ms, updated_at FROM quiz_players WHERE token_hash=?',[game.player_hash]).first();
  const above = await query(db, `SELECT COUNT(*) AS n FROM quiz_players WHERE version=? AND score>=0 AND
    (score>? OR (score=? AND elapsed_ms<?) OR (score=? AND elapsed_ms=? AND updated_at<?))`,
    [VERSION,player.score,player.score,player.elapsed_ms,player.score,player.elapsed_ms,player.updated_at]).first();
  return {phase:'done',score:game.score,elapsedMs:game.elapsed_ms,reason:game.reason,avatar:game.avatar,nickname:game.nickname,
    bestScore:player.score,rank:above.n+1,playerId:player.public_id,...await leaderboard(db)};
}
function question(game) {
  const item = orderedQuestions[game.cursor];
  // La respuesta correcta y la explicación nunca viajan antes de responder.
  const options = [...item.options];
  for(let i=options.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[options[i],options[j]]=[options[j],options[i]];}
  return {id:item.id,text:item.question,category:item.category,difficulty:item.difficulty,options};
}
function publicGame(game, now) {
  return {phase:game.phase,score:game.score,number:game.cursor+1,total:orderedQuestions.length,
    remainingMs:Math.max(0,game.deadline-now),question:question(game)};
}
async function start(db, body, request, now) {
  const nickname = cleanName(body.nickname);
  if(!Number.isInteger(body.avatar)||body.avatar<1||body.avatar>4) fail('Elegí un personaje.');
  const ip = await digest((request.headers.get('cf-connecting-ip')||'local')+new Date(now).toISOString().slice(0,10));
  const rate = await query(db,'SELECT COUNT(*) AS n FROM quiz_games WHERE ip_bucket=? AND created_at>?',[ip,now-3600000]).first();
  if(rate.n>=40) fail('Llegaste al límite de partidas por hora. Volvé más tarde.',429);
  let playerToken = typeof body.playerToken==='string'&&uuidPattern.test(body.playerToken)?body.playerToken:null;
  let hash = playerToken ? await digest(playerToken) : null;
  let player = hash ? await query(db,'SELECT * FROM quiz_players WHERE token_hash=?',[hash]).first() : null;
  if(!player){
    playerToken=crypto.randomUUID();hash=await digest(playerToken);
    await query(db,'INSERT INTO quiz_players (token_hash,public_id,nickname,avatar,version,updated_at) VALUES (?,?,?,?,?,?)',
      [hash,crypto.randomUUID(),nickname,body.avatar,VERSION,now]).run();
  } else if(player.version!==VERSION) {
    await query(db,'UPDATE quiz_players SET score=-1, elapsed_ms=0, version=?, updated_at=? WHERE token_hash=?',[VERSION,now,hash]).run();
  }
  const id=crypto.randomUUID();
  await query(db,`INSERT INTO quiz_games (id,player_hash,nickname,avatar,phase,issued_at,deadline,version,ip_bucket,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`,[id,hash,nickname,body.avatar,'active',now,now+TIME,VERSION,ip,now]).run();
  const game=await query(db,'SELECT * FROM quiz_games WHERE id=?',[id]).first();
  return {gameToken:id,playerToken,...publicGame(game,now)};
}
async function gameAction(db, action, body, now) {
  if(typeof body.gameToken!=='string'||!uuidPattern.test(body.gameToken)) fail('Partida no encontrada.',404);
  let game=await query(db,'SELECT * FROM quiz_games WHERE id=?',[body.gameToken]).first();
  if(!game) fail('Partida no encontrada.',404);
  if(game.version!==VERSION) fail('El quiz se actualizó. Empezá una partida nueva.',409);
  if(game.phase==='done') return result(db,game);
  if(action==='next'){
    if(game.phase!=='ready') fail('Primero respondé la pregunta actual.',409);
    await query(db,`UPDATE quiz_games SET phase='active', issued_at=?, deadline=? WHERE id=? AND phase='ready' AND cursor=?`,
      [now,now+TIME,game.id,game.cursor]).run();
    game=await query(db,'SELECT * FROM quiz_games WHERE id=?',[game.id]).first();
    return publicGame(game,now);
  }
  if(action==='state') {
    if(game.phase==='active'&&now>=game.deadline) {
      await query(db,`UPDATE quiz_games SET phase='done', reason='timeout', finished_at=?, elapsed_ms=elapsed_ms+? WHERE id=? AND phase='active' AND cursor=?`,
        [now,TIME,game.id,game.cursor]).run();
      game=await query(db,'SELECT * FROM quiz_games WHERE id=?',[game.id]).first();
      if(game.phase==='done')return result(db,game);
      return game.phase==='ready'?{phase:'ready',score:game.score}:publicGame(game,now);
    }
    if(game.phase==='ready') return {phase:'ready',score:game.score};
    return publicGame(game,now);
  }
  if(action!=='answer') fail('Operación no encontrada.',404);
  const item=orderedQuestions[game.cursor];
  // Idempotencia: un reintento de una respuesta ya aceptada no consume otra pregunta.
  if(game.phase==='ready') {
    if(orderedQuestions[game.cursor-1]?.id===body.questionId) return {phase:'ready',correct:true,score:game.score};
    fail('La pregunta cambió.',409);
  }
  if(body.questionId!==item.id) fail('La pregunta cambió.',409);
  if(body.choice!==null&&(!Number.isInteger(body.choice)||body.choice<0||body.choice>3)) fail('Respuesta inválida.');
  // El cliente envía el valor elegido, no el puntaje ni el índice barajado como respuesta definitiva.
  const choice=body.value;
  if(body.choice!==null&&(!item.options.includes(choice)||typeof choice!=='string')) fail('Respuesta inválida.');
  if(body.choice===null&&now<game.deadline) return publicGame(game,now);
  const expired=now>=game.deadline;
  const correct=!expired&&body.choice!==null&&choice===item.answer;
  const score=game.score+(correct?1:0);
  const finished=!correct||score===orderedQuestions.length;
  const elapsed=Math.max(0,Math.min(TIME,now-game.issued_at));
  const reason=expired?'timeout':correct?'complete':'wrong';
  const update=await query(db,`UPDATE quiz_games SET score=?,cursor=?,phase=?,reason=?,finished_at=?,elapsed_ms=elapsed_ms+?
    WHERE id=? AND phase='active' AND cursor=? AND deadline=?`,
    [score,game.cursor+(correct?1:0),finished?'done':'ready',finished?reason:null,finished?now:null,elapsed,game.id,game.cursor,game.deadline]).run();
  game=await query(db,'SELECT * FROM quiz_games WHERE id=?',[game.id]).first();
  if(game.phase==='done') return result(db,game);
  if(update.meta.changes===0) return {phase:'ready',correct:true,score:game.score};
  return {phase:'ready',correct:true,score,answer:item.answer,explanation:item.explanation};
}

export default {
  async fetch(request,env) {
    const origin=request.headers.get('Origin');
    const url=new URL(request.url);
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
    if(origin&&ORIGINS.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type';}
    const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
    if(origin&&!ORIGINS.has(origin)) return json({error:'Origen no autorizado.'},403);
    if(request.method==='OPTIONS') return new Response(null,{status:204,headers});
    if(url.pathname==='/') return Response.redirect('https://gb-films.github.io/QUIZ-MESSI/',302);
    try {
      if(!env.DB) fail('El ranking no está disponible. Intentá nuevamente.',503);
      if(request.method==='GET'&&url.pathname==='/api/leaderboard') return json(await leaderboard(env.DB));
      if(request.method!=='POST') return json({error:'No encontrado.'},404);
      if(!request.headers.get('Content-Type')?.includes('application/json')) fail('Formato inválido.',415);
      if(Number(request.headers.get('Content-Length')||0)>2048) fail('Solicitud demasiado grande.',413);
      const raw=await request.text();if(raw.length>2048) fail('Solicitud demasiado grande.',413);
      let body;try{body=JSON.parse(raw);}catch{fail('Formato inválido.');}
      if(!body||typeof body!=='object'||Array.isArray(body)) fail('Formato inválido.');
      const now=Date.now();
      if(url.pathname==='/api/start') return json(await start(env.DB,body,request,now));
      const action=url.pathname.match(/^\/api\/(answer|next|state)$/)?.[1];
      if(!action) return json({error:'No encontrado.'},404);
      return json(await gameAction(env.DB,action,body,now));
    } catch(error) {
      if(!error.status) console.error('Quiz API storage failure',error.message);
      return json({error:error.status?error.message:'El ranking no está disponible. Intentá nuevamente.'},error.status||503);
    }
  }
};
