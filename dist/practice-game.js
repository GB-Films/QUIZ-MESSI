import { orderedQuestions } from './questions.js?v=20261006-2';

// Completely separate from the real game API, identity, lives and ranking.
export function createPracticeGame(now=Date.now) {
 let game;
 const state=()=>({phase:game.phase,rulesVersion:2,score:game.score,lives:game.lives,maxLives:10,total:125,
  ...(game.phase==='active'?{number:game.cursor+1,remainingMs:orderedQuestions[game.cursor].acceptAll?null:Math.max(0,game.deadline-now()),question:{id:orderedQuestions[game.cursor].id,text:orderedQuestions[game.cursor].question,difficulty:orderedQuestions[game.cursor].difficulty,options:orderedQuestions[game.cursor].options,final:!!orderedQuestions[game.cursor].acceptAll}}:game.feedback),
  nickname:'Prueba',rank:null,reason:game.phase==='done'?(game.lives===0?'lives':'complete'):null});
 return (action,body={})=>{
  if(action==='start'){
   if(!Number.isInteger(body.number)||body.number<1||body.number>125)throw new Error('Elegí una pregunta entre 1 y 125.');
   game={cursor:body.number-1,score:0,lives:10,phase:'active',deadline:now()+10000};
   return {...state(),gameToken:'practice'};
  }
  if(!game)throw new Error('Elegí una pregunta para comenzar la prueba.');
  if(action==='next'&&game.phase==='ready'){game.phase='active';game.deadline=now()+10000;}
  if(action==='answer'&&game.phase==='active'){
   const item=orderedQuestions[game.cursor];
   if(body.questionId!==item.id)throw new Error('La pregunta cambió.');
   if(body.choice!==null&&(!Number.isInteger(body.choice)||body.choice<0||body.choice>3||body.value!==item.options[body.choice]))throw new Error('Respuesta inválida.');
   const timeout=!item.acceptAll&&now()>=game.deadline;
   if(body.choice===null&&!timeout)return state();
   const correct=!timeout&&body.choice!==null&&(item.acceptAll||body.value===item.answer);
   game.score+=correct?1:0;game.lives-=correct?0:1;game.cursor++;
   game.feedback={answered:game.cursor,questionId:item.id,acceptedValue:body.choice===null?null:body.value,correct,lastReason:timeout?'timeout':correct?'correct':'wrong',answer:item.acceptAll?'Todas las opciones son correctas':item.answer,explanation:item.explanation,final:!!item.acceptAll};
   game.phase=game.lives===0||game.cursor===125?'done':'ready';
  }
  if(!['start','answer','next','state'].includes(action))throw new Error('Operación de prueba no disponible.');
  return state();
 };
}
