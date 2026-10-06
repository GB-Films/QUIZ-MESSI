import { orderedQuestions } from '../dist/questions.js';
import { firebaseEnabled, createFirebaseRanking } from './firestore.js';
import { createFirebaseGames } from './firebase-games.js';
import { parseRankingPage, rankingPageResult } from './ranking-page.js';
import { VERSION, TIME, RULES_VERSION, gameQuestions, uuidPattern, digest, fail, cleanName, publicGame, deviceGameId, newGame, readyGame, feedback, expired, applyAnswer } from './quiz-rules.js';

export { VERSION } from './quiz-rules.js';
const ORIGINS = new Set(['https://gb-films.github.io','http://127.0.0.1:4173','http://localhost:4173']);
const query = (db, sql, values = []) => db.prepare(sql).bind(...values);
async function leaderboard(db, firebase, page=null,fresh=false) {
  if (firebase) return firebase.leaderboard(page,fresh);
  if(page){
    const values=[VERSION];let after='';
    if(page.after){const [inverseScore,elapsed,updated,id]=page.after.split(':');after=' AND (125-score,elapsed_ms,updated_at,public_id) > (?,?,?,?)';values.push(Number(inverseScore),Number(elapsed),Number(updated),id);}
    values.push(page.limit+1);
    const {results}=await query(db,`SELECT public_id AS id,nickname,avatar,score,elapsed_ms AS elapsedMs,updated_at AS updatedAt FROM quiz_players WHERE version=? AND score>=0${after} ORDER BY score DESC,elapsed_ms ASC,updated_at ASC,public_id ASC LIMIT ?`,values).all();
    const count=await query(db,'SELECT COUNT(*) AS n FROM quiz_players WHERE version=? AND score>=0',[VERSION]).first();
    return rankingPageResult(results,count.n,page);
  }
  const {results} = await query(db, 'SELECT public_id AS id, nickname, avatar, score, elapsed_ms AS elapsedMs FROM quiz_players WHERE version=? AND score>=0 ORDER BY score DESC, elapsed_ms ASC, updated_at ASC LIMIT 5', [VERSION]).all();
  const count = await query(db,'SELECT COUNT(*) AS n FROM quiz_players WHERE version=? AND score>=0',[VERSION]).first();
  return {entries:results,total:count.n};
}
async function result(db, game, firebase) {
  // Cada jugador ocupa una sola fila: se conserva su mejor partida.
  await query(db, `UPDATE quiz_players SET nickname=?, avatar=?, score=?, elapsed_ms=?, updated_at=?
    WHERE token_hash=? AND version=? AND (score<? OR (score=? AND elapsed_ms>?))`,
    [game.nickname,game.avatar,game.score,game.elapsed_ms,game.finished_at,game.player_hash,VERSION,game.score,game.score,game.elapsed_ms]).run();
  const player = await query(db,'SELECT * FROM quiz_players WHERE token_hash=?',[game.player_hash]).first();
  if (firebase) {
    // Retry the retained best record even if the previous Firestore write failed.
    const best = await firebase.saveBest(player);
    const [rank, board] = await Promise.all([firebase.rank(best), firebase.leaderboard()]);
    return {phase:'done',score:game.score,elapsedMs:game.elapsed_ms,reason:game.reason,avatar:game.avatar,nickname:game.nickname,
      bestScore:best.score,rank,playerId:player.public_id,...board,...feedback(game)};
  }
  const above = await query(db, `SELECT COUNT(*) AS n FROM quiz_players WHERE version=? AND score>=0 AND
    (score>? OR (score=? AND elapsed_ms<?) OR (score=? AND elapsed_ms=? AND updated_at<?))`,
    [VERSION,player.score,player.score,player.elapsed_ms,player.score,player.elapsed_ms,player.updated_at]).first();
  return {phase:'done',score:game.score,elapsedMs:game.elapsed_ms,reason:game.reason,avatar:game.avatar,nickname:game.nickname,
    bestScore:player.score,rank:above.n+1,playerId:player.public_id,...await leaderboard(db),...feedback(game)};
}
async function start(db, body, request, now, firebase) {
  const nickname=cleanName(body.nickname);
  if(!Number.isInteger(body.avatar)||body.avatar<1||body.avatar>4)fail('Elegí un personaje.');
  const token=typeof body.playerToken==='string'&&uuidPattern.test(body.playerToken)?body.playerToken:crypto.randomUUID();
  const hash=await digest(token),id=await deviceGameId(hash);
  let game=await query(db,'SELECT * FROM quiz_games WHERE id=?',[id]).first();
  if(!game){
    const ip=await digest((request.headers.get('cf-connecting-ip')||'local')+new Date(now).toISOString().slice(0,10));
    const rate=await query(db,'SELECT COUNT(*) AS n FROM quiz_games WHERE ip_bucket=? AND created_at>?',[ip,now-3600000]).first();
    if(rate.n>=40)fail('Llegaste al límite de partidas por hora. Volvé más tarde.',429);
    await query(db,'INSERT OR IGNORE INTO quiz_players (token_hash,public_id,nickname,avatar,version,updated_at) VALUES (?,?,?,?,?,?)',[hash,crypto.randomUUID(),nickname,body.avatar,VERSION,now]).run();
    game=newGame(id,hash,nickname,body.avatar,now);
    await query(db,'INSERT OR IGNORE INTO quiz_games (id,player_hash,nickname,avatar,phase,issued_at,deadline,version,ip_bucket,created_at,lives,rules_version,bank_version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',[id,hash,nickname,body.avatar,'active',now,now+TIME,VERSION,ip,now,game.lives,RULES_VERSION,game.bank_version]).run();
  }
  return {gameToken:id,playerToken:token,...await gameAction(db,'state',{gameToken:id},now,firebase)};
}
async function gameAction(db,action,body,now,firebase){
  if(typeof body.gameToken!=='string'||!uuidPattern.test(body.gameToken))fail('Partida no encontrada.',404);
  let game=await query(db,'SELECT * FROM quiz_games WHERE id=?',[body.gameToken]).first();
  if(!game)fail('Partida no encontrada.',404);
  if(game.rules_version!==RULES_VERSION)fail('El quiz se actualizó. Volvé al inicio para entrar a la nueva edición.',409);
  if(game.phase==='done')return result(db,game,firebase);
  if(action==='next'){
    if(game.phase==='active')return publicGame(game,now);
    await query(db,"UPDATE quiz_games SET phase='active',issued_at=?,deadline=? WHERE id=? AND phase='ready' AND cursor=?",[now,now+TIME,game.id,game.cursor]).run();
    return publicGame(await query(db,'SELECT * FROM quiz_games WHERE id=?',[game.id]).first(),now);
  }
  if(action==='state'){
    if(game.phase==='ready')return readyGame(game);
    if(!expired(game,now))return publicGame(game,now);
    body={...body,questionId:gameQuestions(game)[game.cursor].id,choice:null};
  }else if(action!=='answer')fail('Operación no encontrada.',404);
  if(game.phase==='ready'){
    if(gameQuestions(game)[game.cursor-1]?.id===body.questionId)return readyGame(game);
    fail('La pregunta cambió.',409);
  }
  const previousCursor=game.cursor;
  if(!applyAnswer(game,body,now))return publicGame(game,now);
  await query(db,"UPDATE quiz_games SET score=?,cursor=?,phase=?,reason=?,finished_at=?,elapsed_ms=?,lives=?,last_correct=?,last_reason=?,last_value=? WHERE id=? AND phase='active' AND cursor=? AND deadline=?",[game.score,game.cursor,game.phase,game.reason,game.finished_at,game.elapsed_ms,game.lives,game.last_correct,game.last_reason,game.last_value,game.id,previousCursor,game.deadline]).run();
  game=await query(db,'SELECT * FROM quiz_games WHERE id=?',[game.id]).first();
  return game.phase==='done'?result(db,game,firebase):readyGame(game);
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
      if(env.QUIZ_MAINTENANCE==='true'&&url.pathname!=='/api/leaderboard') fail('Estamos actualizando el guardado. Intentá nuevamente en un momento.',503);
      const cloudGames=env.FIREBASE_GAMES_ENABLED==='true'?createFirebaseGames(env):null;
      if(!cloudGames&&!env.DB) fail('El ranking no está disponible. Intentá nuevamente.',503);
      const firebase=firebaseEnabled(env)?createFirebaseRanking(env,VERSION):null;
      if(request.method==='GET'&&url.pathname==='/api/leaderboard') {const page=parseRankingPage(url.searchParams),fresh=url.searchParams.get('fresh')==='1';return json(await (cloudGames?cloudGames.leaderboard(page,fresh):leaderboard(env.DB,firebase,page,fresh)));}
      if(request.method!=='POST') return json({error:'No encontrado.'},404);
      if(!request.headers.get('Content-Type')?.includes('application/json')) fail('Formato inválido.',415);
      if(Number(request.headers.get('Content-Length')||0)>2048) fail('Solicitud demasiado grande.',413);
      const raw=await request.text();if(raw.length>2048) fail('Solicitud demasiado grande.',413);
      let body;try{body=JSON.parse(raw);}catch{fail('Formato inválido.');}
      if(!body||typeof body!=='object'||Array.isArray(body)) fail('Formato inválido.');
      const now=Date.now();
      if(url.pathname==='/api/start') return json(await (cloudGames?cloudGames.start(body,now):start(env.DB,body,request,now,firebase)));
      const action=url.pathname.match(/^\/api\/(answer|next|state)$/)?.[1];
      if(!action) return json({error:'No encontrado.'},404);
      return json(await (cloudGames?cloudGames.action(action,body,now):gameAction(env.DB,action,body,now,firebase)));
    } catch(error) {
      if(!error.status) console.error('Quiz API storage failure',error.message);
      return json({error:error.status?error.message:'El ranking no está disponible. Intentá nuevamente.'},error.status||503);
    }
  }
};
