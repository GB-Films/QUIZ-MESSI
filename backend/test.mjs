import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import worker from './index.js';
import { orderedQuestions } from '../dist/questions.js';
export function memoryDB() {
  const sqlite=new DatabaseSync(':memory:');
  return {sqlite,prepare(sql){return {bind(...values){const st=sqlite.prepare(sql);return {
    async first(){return st.get(...values)||null;},async all(){return {results:st.all(...values)};},
    async run(){return {meta:{changes:st.run(...values).changes}};}
  };}};}};
}
const db=memoryDB();
db.sqlite.exec(await readFile('drizzle/0000_misty_marvel_apes.sql','utf8'));
let now=1900000000000;
const actualNow=Date.now;Date.now=()=>now;
async function post(action,body){
  const response=await worker.fetch(new Request('https://quiz.test/api/'+action,{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://gb-films.github.io'},body:JSON.stringify(body)}),{DB:db});
  return {status:response.status,...await response.json()};
}
try {
  assert.equal((await post('start',{nickname:'<script>',avatar:3})).status,400);
  const game=await post('start',{nickname:'Leo',avatar:3,score:125});
  assert.equal(game.score,0);assert.equal(game.remainingMs,10000);
  assert.ok(!('answer' in game.question));assert.ok(!('explanation' in game.question));
  const correct=orderedQuestions[0].answer;
  now+=500;
  const payload={gameToken:game.gameToken,questionId:game.question.id,choice:0,value:correct,score:125};
  assert.equal((await post('answer',payload)).score,1);
  assert.equal((await post('answer',payload)).score,1);
  assert.equal((await post('state',{gameToken:game.gameToken})).phase,'ready');
  const next=await post('next',{gameToken:game.gameToken});
  assert.equal(next.number,2);assert.equal(next.remainingMs,10000);
  const wrong=next.question.options.find(x=>x!==orderedQuestions[1].answer);
  now+=1000;
  const lost=await post('answer',{gameToken:game.gameToken,questionId:next.question.id,choice:0,value:wrong});
  assert.equal(lost.phase,'done');assert.equal(lost.score,1);assert.equal(lost.rank,1);assert.equal(lost.total,1);
  assert.equal((await post('next',{gameToken:game.gameToken})).phase,'done');
  const other=await post('start',{nickname:'Otro',avatar:1});now+=10001;
  const timeout=await post('answer',{gameToken:other.gameToken,questionId:other.question.id,choice:0,value:correct});
  assert.equal(timeout.score,0);assert.equal(timeout.reason,'timeout');assert.equal(timeout.rank,2);
  const retry=await post('start',{nickname:'Leo',avatar:3,playerToken:game.playerToken});
  now+=10001;
  const retryResult=await post('state',{gameToken:retry.gameToken});
  assert.equal(retryResult.bestScore,1);assert.equal(retryResult.total,2);
  assert.equal((await post('state',{gameToken:crypto.randomUUID()})).status,404);
  assert.equal(retryResult.entries.length,2);
  const early=await post('start',{nickname:'Temprano',avatar:2});
  assert.equal((await post('answer',{gameToken:early.gameToken,questionId:early.question.id,choice:null})).phase,'active');
  assert.equal((await post('answer',{gameToken:early.gameToken,questionId:early.question.id,choice:0,value:'inventado'})).status,400);
  console.log('API verificada: una vida, reloj, reintentos, puntajes y ranking global.');
} finally {Date.now=actualNow;db.sqlite.close();}
