import { orderedQuestions } from '../dist/questions.js';

export const VERSION = 'argentina-survival-1';
export const TIME = 10000;
export const LIVES = 10;
export const RULES_VERSION = 2;
export const uuidPattern = /^[a-f0-9-]{36}$/i;
export const digest = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
export function fail(message, status = 400) { throw Object.assign(new Error(message), {status}); }
export function cleanName(value) {
  if (typeof value !== 'string') fail('Escribí tu nombre para el ranking.');
  const name = value.normalize('NFC').trim().replace(/\s+/g,' ');
  if (name.length < 2 || name.length > 20 || /[<>\p{Cc}\p{Cf}]/u.test(name)) fail('Usá un nombre de 2 a 20 caracteres.');
  return name;
}
export function question(game) {
  const item = orderedQuestions[game.cursor];
  const options = [...item.options];
  for(let i=options.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[options[i],options[j]]=[options[j],options[i]];}
  return {id:item.id,text:item.question,category:item.category,difficulty:item.difficulty,options,final:!!item.acceptAll};
}
export function publicGame(game, now) {
  return {phase:game.phase,rulesVersion:RULES_VERSION,score:game.score,lives:game.lives,maxLives:LIVES,number:game.cursor+1,total:orderedQuestions.length,
    remainingMs:orderedQuestions[game.cursor].acceptAll?null:Math.max(0,game.deadline-now),question:question(game)};
}
export async function deviceGameId(hash) {
  const id=await digest(`${hash}:rules-${RULES_VERSION}`);
  return `${id.slice(0,8)}-${id.slice(8,12)}-${id.slice(12,16)}-${id.slice(16,20)}-${id.slice(20,32)}`;
}
export function newGame(id,hash,nickname,avatar,now) {
  return {id,player_hash:hash,nickname,avatar,phase:'active',score:0,cursor:0,lives:LIVES,rules_version:RULES_VERSION,last_correct:0,last_reason:null,issued_at:now,deadline:now+TIME,version:VERSION,created_at:now,elapsed_ms:0,reason:null,finished_at:null};
}
export function feedback(game) {
  const item=orderedQuestions[game.cursor-1];
  return {rulesVersion:RULES_VERSION,correct:!!game.last_correct,lastReason:game.last_reason,answer:item.acceptAll?'Todas las opciones son correctas':item.answer,explanation:item.explanation,lives:game.lives,maxLives:LIVES,answered:game.cursor,final:!!item.acceptAll};
}
export function readyGame(game) {return {phase:'ready',score:game.score,total:orderedQuestions.length,...feedback(game)};}
export function expired(game,now) {return game.phase==='active'&&!orderedQuestions[game.cursor].acceptAll&&now>=game.deadline;}
export function applyAnswer(game,body,now) {
  const item=orderedQuestions[game.cursor];
  if(body.questionId!==item.id)fail('La pregunta cambió.',409);
  if(body.choice!==null&&(!Number.isInteger(body.choice)||body.choice<0||body.choice>3||typeof body.value!=='string'||!item.options.includes(body.value)))fail('Respuesta inválida.');
  if(body.choice===null&&!expired(game,now))return false;
  const timeout=expired(game,now);
  const correct=!timeout&&body.choice!==null&&(item.acceptAll||body.value===item.answer);
  game.score+=correct?1:0;
  game.lives-=correct?0:1;
  game.cursor++;
  game.last_correct=correct?1:0;
  game.last_reason=timeout?'timeout':correct?'correct':'wrong';
  game.elapsed_ms+=item.acceptAll?0:Math.max(0,Math.min(TIME,now-game.issued_at));
  const finished=game.lives===0||game.cursor===orderedQuestions.length;
  game.phase=finished?'done':'ready';
  game.reason=finished?(game.lives===0?'lives':'complete'):null;
  game.finished_at=finished?now:null;
  return true;
}
