import { orderedQuestions } from '../dist/questions.js';

export const VERSION = 'argentina-survival-1';
export const TIME = 10000;
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
  return {id:item.id,text:item.question,category:item.category,difficulty:item.difficulty,options};
}
export function publicGame(game, now) {
  return {phase:game.phase,score:game.score,number:game.cursor+1,total:orderedQuestions.length,
    remainingMs:Math.max(0,game.deadline-now),question:question(game)};
}
