import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { createFirebaseRanking } from './firestore.js';
import worker, { VERSION } from './index.js';
import { orderedQuestions } from '../dist/questions.js';
import { gameScenarios } from './game-scenarios.mjs';

const pair = await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const pem = `-----BEGIN PRIVATE KEY-----\n${Buffer.from(await crypto.subtle.exportKey('pkcs8',pair.privateKey)).toString('base64')}\n-----END PRIVATE KEY-----`;
const env = {FIREBASE_PROJECT_ID:'demo-messi',FIREBASE_CLIENT_EMAIL:'quiz@demo-messi.iam.gserviceaccount.com',FIREBASE_PRIVATE_KEY:pem,FIREBASE_CACHE_MS:'0'};
const documents = new Map();
const originalFetch = globalThis.fetch;
let revision = 0, outage = false, rankingOutage = false, loseCommitResponse = false, conflict = null, tokens = 0, queryCalls = 0;
const json = (data,status=200) => Response.json(data,{status});
const entryData = doc => Object.fromEntries(Object.entries(doc.fields).map(([key,value]) => [key,value.integerValue === undefined ? value.stringValue : Number(value.integerValue)]));
globalThis.fetch = async (input, options) => {
  const url = new URL(input);
  if (url.hostname === 'oauth2.googleapis.com') {
    tokens++;
    const assertion = new URLSearchParams(options.body).get('assertion');
    const [header,payload,signature] = assertion.split('.');
    assert.ok(await crypto.subtle.verify('RSASSA-PKCS1-v1_5',pair.publicKey,Buffer.from(signature,'base64url'),new TextEncoder().encode(`${header}.${payload}`)));
    const claims = JSON.parse(Buffer.from(payload,'base64url'));
    assert.equal(claims.iss,env.FIREBASE_CLIENT_EMAIL);
    assert.equal(claims.scope,'https://www.googleapis.com/auth/datastore');
    return json({access_token:'test-token',expires_in:3600});
  }
  assert.equal(url.hostname,'firestore.googleapis.com');
  assert.equal(options.headers.Authorization,'Bearer test-token');
  if (outage) return json({error:{status:'UNAVAILABLE'}},503);
  const path = url.pathname.slice(4);
  if (rankingOutage && (path.endsWith(':runQuery') || path.endsWith(':runAggregationQuery'))) return json({error:{status:'UNAVAILABLE'}},503);
  if (!options.body) return documents.has(path) ? json(documents.get(path)) : json({error:{status:'NOT_FOUND'}},404);
  const body = JSON.parse(options.body);
  if (path.endsWith(':commit')) {
    const write = body.writes[0], previous = documents.get(write.update.name);
    if (conflict) {
      documents.set(write.update.name,conflict); conflict = null;
      return json({error:{status:'FAILED_PRECONDITION'}},400);
    }
    // Check every precondition before applying any write: Firestore commits are atomic.
    for (const item of body.writes) {
      const before = documents.get(item.update.name);
      if (item.currentDocument.exists === false ? Boolean(before) : before?.updateTime !== item.currentDocument.updateTime) return json({error:{status:'FAILED_PRECONDITION'}},400);
    }
    for (const item of body.writes) documents.set(item.update.name,{...item.update,updateTime:`revision-${++revision}`});
    if (loseCommitResponse) {loseCommitResponse=false;throw new TypeError('Simulated connection lost after successful commit');}
    return json({writeResults:[{updateTime:`revision-${revision}`}]});
  }
  const prefix = path.split(':')[0] + '/players/';
  let entries = [...documents.values()].filter(doc=>doc.name.startsWith(prefix));
  if (path.endsWith(':runQuery')) {
    queryCalls++;
    assert.ok(body.structuredQuery.limit>=2&&body.structuredQuery.limit<=51);
    const cursor=body.structuredQuery.startAt;
    if(cursor){assert.equal(cursor.before,false);entries=entries.filter(doc=>entryData(doc).orderKey>cursor.values[0].stringValue);}
    entries.sort((a,b)=>entryData(a).orderKey.localeCompare(entryData(b).orderKey));
    return json(entries.slice(0,body.structuredQuery.limit).map(document=>({document})));
  }
  assert.ok(path.endsWith(':runAggregationQuery'));
  const filter = body.structuredAggregationQuery.structuredQuery.where?.fieldFilter;
  const total = filter ? entries.filter(doc=>entryData(doc).orderKey < filter.value.stringValue).length : entries.length;
  return json([{result:{aggregateFields:{total:{integerValue:String(total)}}}}]);
};
const player = (id,score,elapsed=500,updated=1000) => ({public_id:id,nickname:id,avatar:3,score,elapsed_ms:elapsed,updated_at:updated});
let sqlite;
try {
  const ranking = createFirebaseRanking(env,VERSION);
  assert.deepEqual(await ranking.leaderboard(),{entries:[],total:0});
  const best = await ranking.saveBest(player('leo',10));
  await ranking.saveBest(player('leo',2));
  assert.equal((await ranking.leaderboard()).entries[0].score,10);
  const faster = await ranking.saveBest(player('fast',10,400));
  const earlier = await ranking.saveBest(player('first',10,400,900));
  assert.equal(await ranking.rank(best),3);
  assert.equal(await ranking.rank(faster),2);
  assert.equal(await ranking.rank(earlier),1);
  assert.equal((await ranking.saveBest(player('leo',10,500,2000))).updatedAt,1000);
  for (let i=0;i<5;i++) await ranking.saveBest(player(`other-${i}`,i));
  const restored = await createFirebaseRanking(env,VERSION).leaderboard();
  assert.equal(restored.entries.length,5); assert.equal(restored.total,8);
  assert.deepEqual(restored.entries.slice(0,3).map(entry=>entry.id),['first','fast','leo']);
  assert.ok(restored.entries.every(entry=>!('orderKey' in entry)&&!('token_hash' in entry)));
  assert.equal((await createFirebaseRanking(env,'another-version').leaderboard()).total,0);
  const path = `projects/demo-messi/databases/(default)/documents/quizRankings/${VERSION}/players/leo`;
  const concurrent = structuredClone(documents.get(path));
  concurrent.fields.score = {integerValue:'15'};
  concurrent.fields.orderKey = {stringValue:entryData(concurrent).orderKey.replace(/^115/,'110')};
  concurrent.updateTime = 'concurrent'; conflict = concurrent;
  assert.equal((await ranking.saveBest(player('leo',11))).score,15,'A concurrent better score is retained');
  assert.equal(tokens,1,'Server authentication is cached');

  // A cloud failure after SQLite commits must recover the result on retry.
  sqlite = new DatabaseSync(':memory:');
  sqlite.exec(await readFile('drizzle/0000_misty_marvel_apes.sql','utf8'));
sqlite.exec(await readFile('drizzle/0001_ten_lives.sql','utf8'));
sqlite.exec(await readFile('drizzle/0002_accepted_answer.sql','utf8'));
  env.DB = {prepare(sql){return {bind(...values){const statement=sqlite.prepare(sql);return {async first(){return statement.get(...values)||null;},async all(){return {results:statement.all(...values)};},async run(){return {meta:{changes:statement.run(...values).changes}};}};}};}};
  async function post(action,body){const response=await worker.fetch(new Request(`https://quiz.test/api/${action}`,{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://gb-films.github.io'},body:JSON.stringify(body)}),env);return {status:response.status,...await response.json()};}
  const game = await post('start',{nickname:'Nube',avatar:3});
  const wrong = game.question.options.find(value=>value!==orderedQuestions[0].answer);
  for(let i=0;i<9;i++){
    const state=await post('state',{gameToken:game.gameToken});
    const active=state.phase==='ready'?await post('next',{gameToken:game.gameToken}):state;
    await post('answer',{gameToken:game.gameToken,questionId:active.question.id,choice:0,value:active.question.options.find(v=>v!==orderedQuestions[active.number-1].answer)});
  }
  const tenth=await post('next',{gameToken:game.gameToken});
  outage = true;
  const lost = await post('answer',{gameToken:game.gameToken,questionId:tenth.question.id,choice:0,value:tenth.question.options.find(v=>v!==orderedQuestions[tenth.number-1].answer),score:125});
  assert.equal(lost.status,503);
  outage = false;
  const retry = await post('state',{gameToken:game.gameToken});
  assert.equal(retry.status,200); assert.equal(retry.phase,'done'); assert.equal(retry.score,0); assert.equal(retry.bestScore,0);
  assert.equal(retry.total,9);
  assert.equal((await post('state',{gameToken:game.gameToken})).total,9,'A retry does not create a duplicate');
  outage = true;
  const unavailable = await worker.fetch(new Request('https://quiz.test/api/leaderboard'),env);
  assert.equal(unavailable.status,503,'Cloud outages never silently return the local ranking');
  outage = false;

  // The scalable mode needs no D1 database; game, identity and record commit together.
  const cloudEnv = {...env,DB:undefined,FIREBASE_GAMES_ENABLED:'true'};
  const actualNow = Date.now;
  let now = actualNow();
  Date.now = () => now;
  try {
    async function cloudPost(action,body){const response=await worker.fetch(new Request(`https://quiz.test/api/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),cloudEnv);return {status:response.status,...await response.json()};}
    await gameScenarios(cloudPost,ms=>now+=ms);
    const lostStart={nickname:'Reconectar',avatar:3,playerToken:crypto.randomUUID(),requestId:crypto.randomUUID()};
    loseCommitResponse=true;
    assert.equal((await cloudPost('start',lostStart)).status,503);
    const recovered=await cloudPost('start',lostStart);assert.equal(recovered.status,200);assert.equal(recovered.lives,10);
    const answerBody={gameToken:recovered.gameToken,questionId:recovered.question.id,choice:0,value:recovered.question.options.find(v=>v!==orderedQuestions[0].answer)};
    loseCommitResponse=true;assert.equal((await cloudPost('answer',answerBody)).status,503);
    const feedback=await cloudPost('state',{gameToken:recovered.gameToken});assert.equal(feedback.lives,9);assert.equal(feedback.answer,orderedQuestions[0].answer);
    assert.equal((await cloudPost('answer',answerBody)).lives,9);
    for(let i=0;i<8;i++){const q=await cloudPost('next',{gameToken:recovered.gameToken});await cloudPost('answer',{gameToken:recovered.gameToken,questionId:q.question.id,choice:0,value:q.question.options.find(v=>v!==orderedQuestions[q.number-1].answer)});}
    const last=await cloudPost('next',{gameToken:recovered.gameToken});rankingOutage=true;
    const finished=await cloudPost('answer',{gameToken:recovered.gameToken,questionId:last.question.id,choice:0,value:last.question.options.find(v=>v!==orderedQuestions[last.number-1].answer)});
    assert.equal(finished.resultSaved,true);assert.equal(finished.rankingPending,true);assert.equal(finished.lives,0);
    rankingOutage=false;assert.ok(Number.isInteger((await cloudPost('state',{gameToken:recovered.gameToken})).rank));
    const totalBefore=(await createFirebaseRanking(env,VERSION).leaderboard()).total;
    const games=await Promise.all(Array.from({length:100},(_,i)=>cloudPost('start',{nickname:i<2?'Mismo nombre':'Carga '+i,avatar:3,playerToken:crypto.randomUUID()})));
    assert.ok(games.every(g=>g.status===200));
    for(let round=0;round<10;round++){
      const feedbacks=await Promise.all(games.map(async g=>{const q=round===0?g:await cloudPost('next',{gameToken:g.gameToken});return cloudPost('answer',{gameToken:g.gameToken,questionId:q.question.id,choice:0,value:q.question.options.find(v=>v!==orderedQuestions[q.number-1].answer)});}));
      assert.ok(feedbacks.every(r=>r.status===200&&r.lives===9-round));
    }
    assert.equal((await createFirebaseRanking(env,VERSION).leaderboard()).total,totalBefore+100);
    const finishedIds=new Set();
    for(const [i,g] of games.entries()){
      const result=await cloudPost('state',{gameToken:g.gameToken});
      assert.equal(result.phase,'done');assert.equal(result.reason,'lives');assert.equal(result.resultSaved,true);assert.equal(result.score,0);
      const record=entryData(documents.get(`projects/demo-messi/databases/(default)/documents/quizRankings/${VERSION}/players/${result.playerId}`));
      assert.equal(record.nickname,i<2?'Mismo nombre':'Carga '+i);assert.equal(record.score,0);finishedIds.add(result.playerId);
    }
    assert.equal(finishedIds.size,100,'Each eliminated player has a distinct saved public record, including zero scores');
    const duplicates=await Promise.all(games.slice(0,2).map(g=>cloudPost('state',{gameToken:g.gameToken})));
    assert.notEqual(duplicates[0].playerId,duplicates[1].playerId,'Repeated names never share or overwrite a public record');
    const resumed=await cloudPost('start',{nickname:'Otro nombre',avatar:3,playerToken:games[0].playerToken});
    assert.equal(resumed.playerId,duplicates[0].playerId);assert.equal(resumed.phase,'done');assert.equal(resumed.nickname,'Mismo nombre');
    const clearedBrowser=await cloudPost('start',{nickname:'Mismo nombre',avatar:3,playerToken:crypto.randomUUID()});
    assert.notEqual(clearedBrowser.gameToken,games[0].gameToken,'A lost browser identity cannot be inferred from a repeated name');
    assert.equal((await createFirebaseRanking(env,VERSION).leaderboard()).total,totalBefore+100,'Losing browser storage never removes existing cloud records');
    assert.equal((await cloudPost('state',{gameToken:games[0].gameToken})).playerId,duplicates[0].playerId,'The original saved result remains recoverable with its private identifier');
    let cursor=null;const all=[];
    do{
      const params=new URLSearchParams({limit:'17'});if(cursor)params.set('cursor',cursor);
      const response=await worker.fetch(new Request(`https://quiz.test/api/leaderboard?${params}`),cloudEnv);
      assert.equal(response.status,200);
      const page=await response.json();assert.equal(page.startRank,all.length+1);assert.ok(page.entries.length<=17);all.push(...page.entries);cursor=page.nextCursor;
    }while(cursor);
    assert.equal(all.length,totalBefore+100);assert.equal(new Set(all.map(r=>r.id)).size,all.length);
    assert.ok([...finishedIds].every(id=>all.some(r=>r.id===id)),'Anonymous visitors can reach every eliminated player through the public ranking');
    assert.ok(all.every(r=>Object.keys(r).sort().join(',')==='avatar,elapsedMs,id,nickname,score'));
    for(const invalid of ['limit=0','limit=51','cursor=invalid','limit=1.5']){
      assert.equal((await worker.fetch(new Request(`https://quiz.test/api/leaderboard?${invalid}`),cloudEnv)).status,400);
    }
    const callsBefore = queryCalls;
    const cachedEnv = {...env,FIREBASE_CACHE_MS:'15000'};
    await Promise.all(Array.from({length:100},()=>createFirebaseRanking(cachedEnv,VERSION).leaderboard()));
    assert.equal(queryCalls,callsBefore+1,'100 simultaneous leaderboard reads share one query in the server instance');
    const cachedRanking=createFirebaseRanking(cachedEnv,VERSION),cachedBoard=await cachedRanking.leaderboard();
    const oldPage=await cachedRanking.leaderboard({limit:5,after:null,offset:0});
    await cachedRanking.saveBest(player('fresh-check',125,1,now));
    assert.equal((await cachedRanking.leaderboard()).total,cachedBoard.total,'Compatibility cache can still hold the old snapshot');
    const freshResponse=await worker.fetch(new Request('https://quiz.test/api/leaderboard?limit=5&fresh=1'),{...cloudEnv,FIREBASE_CACHE_MS:'15000'});
    const freshPage=await freshResponse.json();
    assert.equal(freshPage.total,oldPage.total+1,'Refresh bypasses both the page cache and the total cache');
    assert.equal(freshPage.entries[0].id,'fresh-check');
    assert.equal(freshResponse.headers.get('Cache-Control'),'no-store');
    console.log('Ranking actualizado verificado: un récord nuevo aparece al refrescar sin esperar los quince segundos de caché.');
    console.log('Partidas en Firebase verificadas sin D1: guardado atómico, inicios y respuestas simultáneas sin duplicados, reloj y resultado visible ante cortes del ranking.');
    console.log('Carga simulada verificada: 100 jugadores concurrentes sin pérdidas y 100 consultas de ranking agrupadas en una consulta por instancia. No constituye una prueba de capacidad de la nube.');
    console.log('Ranking público completo verificado: todos los jugadores eliminados, incluidos cero aciertos, accesibles por páginas sin duplicados ni campos privados.');
  } finally {Date.now=actualNow;}
  const firestoreMock=globalThis.fetch;
  let refreshCalls=0;
  globalThis.fetch=async(url,options)=>{
    if(String(url).startsWith('https://securetoken.googleapis.com/')){
      refreshCalls++;
      assert.equal(new URLSearchParams(options.body).get('refresh_token'),'server-only-refresh');
      return Response.json({id_token:'limited-server-id-token',expires_in:'3600'});
    }
    assert.equal(options.headers.Authorization,'Bearer limited-server-id-token');
    return Response.json([]);
  };
  try{
    const tokenEnv={FIREBASE_PROJECT_ID:'limited-auth-test',FIREBASE_API_KEY:'test-key',FIREBASE_REFRESH_TOKEN:'server-only-refresh',FIREBASE_CACHE_MS:'0'};
    await Promise.all(Array.from({length:20},()=>createFirebaseRanking(tokenEnv,VERSION).leaderboard()));
    await createFirebaseRanking(tokenEnv,VERSION).leaderboard();
    assert.equal(refreshCalls,1,'Concurrent requests refresh the limited server identity once and reuse its token');
  }finally{globalThis.fetch=firestoreMock;}
  const paused=await worker.fetch(new Request('https://quiz.test/api/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nickname:'Corte'})}),{QUIZ_MAINTENANCE:'true'});
  assert.equal(paused.status,503,'Migration pause rejects mutations before touching storage');
  console.log('Firebase verificado: firma y renovación del acceso limitado del servidor, persistencia, desempates, concurrencia, reintentos y recuperación ante cortes.');
} finally {
  globalThis.fetch = originalFetch;
  sqlite?.close();
}
