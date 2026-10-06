import assert from 'node:assert/strict';
import { orderedQuestions } from '../dist/questions.js';

export async function gameScenarios(post,advance) {
  const identity={nickname:'Diez vidas',avatar:3,playerToken:crypto.randomUUID(),requestId:crypto.randomUUID()};
  const starts=await Promise.all(Array.from({length:12},()=>post('start',{...identity,requestId:crypto.randomUUID()})));
  assert.ok(starts.every(g=>g.status===200&&g.gameToken===starts[0].gameToken&&g.lives===10));
  const game=starts[0];assert.equal(game.score,0);assert.ok(!('answer' in game.question));
  assert.equal((await post('answer',{gameToken:game.gameToken,questionId:game.question.id,choice:0,value:'inventado'})).status,400);
  assert.equal((await post('answer',{gameToken:game.gameToken,questionId:game.question.id,choice:null})).phase,'active');
  advance(500);
  const first={gameToken:game.gameToken,questionId:game.question.id,choice:0,value:orderedQuestions[0].answer,score:125,lives:999};
  const goals=await Promise.all(Array.from({length:12},()=>post('answer',first)));
  assert.ok(goals.every(g=>g.status===200&&g.score===1&&g.lives===10&&g.correct));
  advance(120000);
  const paused=await post('state',{gameToken:game.gameToken});
  assert.equal(paused.phase,'ready');assert.equal(paused.score,1);assert.equal(paused.lives,10);assert.equal(paused.answered,1);
  const second=await post('next',{gameToken:game.gameToken});advance(250);
  assert.equal(second.remainingMs,10000);
  const nextRetry=await post('next',{gameToken:game.gameToken});assert.equal(nextRetry.number,2);assert.equal(nextRetry.remainingMs,second.remainingMs-250);
  const bad={gameToken:game.gameToken,questionId:second.question.id,choice:0,value:second.question.options.find(v=>v!==orderedQuestions[1].answer)};
  const errors=await Promise.all(Array.from({length:12},()=>post('answer',bad)));
  assert.ok(errors.every(g=>g.status===200&&g.score===1&&g.lives===9&&!g.correct&&g.answer===orderedQuestions[1].answer));
  advance(120000);
  assert.equal((await post('state',{gameToken:game.gameToken})).phase,'ready');
  assert.equal((await post('state',{gameToken:game.gameToken})).lives,9);
  const resume=await post('start',{...identity,nickname:'Otro nombre',requestId:crypto.randomUUID()});assert.equal(resume.gameToken,game.gameToken);assert.equal(resume.phase,'ready');assert.equal(resume.lives,9);
  const third=await post('next',{gameToken:game.gameToken});assert.equal(third.number,3);advance(10001);
  const timeouts=await Promise.all(Array.from({length:12},()=>post('state',{gameToken:game.gameToken})));
  assert.ok(timeouts.every(g=>g.status===200&&g.lives===8&&g.lastReason==='timeout'&&g.answer===orderedQuestions[2].answer));
  for(let i=0;i<8;i++){
    const q=await post('next',{gameToken:game.gameToken});
    const expected=orderedQuestions[q.number-1];advance(100);
    const r=await post('answer',{gameToken:game.gameToken,questionId:q.question.id,choice:0,value:q.question.options.find(v=>v!==expected.answer)});
    assert.equal(r.lives,7-i);assert.equal(r.score,1);assert.equal(r.phase,i===7?'done':'ready');
    if(i===7){assert.equal(r.reason,'lives');assert.equal(r.answer,expected.answer);assert.ok(r.explanation);assert.ok(r.bestScore>=1);}
  }
  const blocked=await post('start',{...identity,nickname:'No reinicia',requestId:crypto.randomUUID()});assert.equal(blocked.phase,'done');assert.equal(blocked.lives,0);assert.equal(blocked.gameToken,game.gameToken);
  assert.equal((await post('next',{gameToken:game.gameToken})).lives,0);
  assert.equal((await post('state',{gameToken:crypto.randomUUID()})).status,404);
  // Every final option is accepted, without a clock or a deducted life.
  for(let choice=0;choice<4;choice++){
    const playerToken=crypto.randomUUID();
    let current=await post('start',{nickname:'Final '+choice,avatar:3,playerToken});const token=current.gameToken;
    for(let i=0;i<orderedQuestions.length-1;i++){
      const miss=choice===0&&i===10;
      advance(50);const response=await post('answer',{gameToken:token,questionId:current.question.id,choice:0,value:miss?current.question.options.find(v=>v!==orderedQuestions[i].answer):orderedQuestions[i].answer});
      assert.equal(response.score,i+1-(choice===0&&i>=10?1:0));assert.equal(response.lives,choice===0&&i>=10?9:10);
      current=await post('next',{gameToken:token});
    }
    assert.equal(current.number,125);assert.equal(current.question.final,true);assert.equal(current.remainingMs,null);advance(60000);
    assert.equal((await post('state',{gameToken:token})).phase,'active');
    const final=await post('answer',{gameToken:token,questionId:current.question.id,choice,value:current.question.options[choice]});
    assert.equal(final.phase,'done');assert.equal(final.reason,'complete');assert.equal(final.score,choice===0?124:125);assert.equal(final.lives,choice===0?9:10);assert.equal(final.final,true);
    assert.equal((await post('start',{nickname:'Final '+choice,avatar:3,playerToken})).phase,'done');
  }
  console.log('Diez vidas verificadas: errores y tiempos simultáneos, reintentos, progreso persistente, bloqueo definitivo y cuatro respuestas finales correctas.');
}
