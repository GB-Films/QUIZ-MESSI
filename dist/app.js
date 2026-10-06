import { difficultyLabels, orderedQuestions } from './questions.js?v=20261006-2';
import { tiers, tierForScore } from './tiers.js?v=20261006-3';
import { createPracticeGame } from './practice-game.js?v=20261006-2';
const API=['127.0.0.1','localhost'].includes(location.hostname)?'/api':'https://messi-quiz-albiceleste.guidoboetsch.chatgpt.site/api';
const PRACTICE=location.pathname.endsWith('/prueba.html'), practice=createPracticeGame();
const app=document.querySelector('#app'), KEY=PRACTICE?'messi-practice-v1':(['localhost','127.0.0.1'].includes(location.hostname)&&location.pathname==='/connection-check.html'?'messi-connection-check':'messi-survival-v1');
let saved=readSaved(), storageReady=true, game=null, timer=null, deadline=0, busy=false, rankingResize=null, rankingRefresh=null, rankingResume=null, rankingGeneration=0;
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const aciertos=n=>`${n} ${n===1?'acierto':'aciertos'}`;
function readSaved(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch{return {};}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(saved));storageReady=true;}catch{storageReady=false;}}
// The identity is retained before the first request, including lost start responses.
saved.playerToken ||= saved.pendingStart?.playerToken || crypto.randomUUID();persist();
function balls(lives=10){return `<div class="lives" role="img" aria-label="${lives} de 10 vidas disponibles">${Array.from({length:10},(_,i)=>`<span class="ball ${i<lives?'':'spent'}" aria-hidden="true">⚽</span>`).join('')}<b>${lives}/10 VIDAS</b></div>`;}
function stopTimer(){clearInterval(timer);timer=null;}
function screen(mode,html){stopTimer();rankingGeneration++;clearInterval(rankingRefresh);rankingRefresh=null;rankingResume=null;if(rankingResize){window.removeEventListener('resize',rankingResize);rankingResize=null;}document.body.dataset.screen=mode;app.innerHTML=html;window.scrollTo(0,0);}
function portrait(score,cls='portrait'){const a=tierForScore(score);return `<img class="${cls}" src="./assets/levels/${a.image}" alt="${esc(a.alt)}" title="${esc(a.name)}" style="object-position:${a.position};${cls==='portrait'&&a.fit?'object-fit:'+a.fit:''}" draggable="false">`;}
async function api(action,body,params=''){
 if(PRACTICE&&action!=='leaderboard')return practice(action,body);
 const sent=performance.now(),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(`${API}/${action}${params}`,{method:body?'POST':'GET',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:controller.signal});
  const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error||'No se pudo conectar con el ranking.'),{retryable:response.status>=500});
  if(action!=='leaderboard'&&data.rulesVersion!==2)throw new Error('Estamos actualizando el quiz. Reconectá en un momento para jugar con tus diez vidas.');
  if(typeof data.remainingMs==='number')data.remainingMs=Math.max(0,data.remainingMs-(performance.now()-sent)/2);
  return data;
 }catch(error){if(error.name==='AbortError'||error instanceof TypeError)throw Object.assign(new Error('No pudimos confirmar la respuesta. Tu elección sigue guardada; reconectá para recuperarla.'),{retryable:true});throw error;}
 finally{clearTimeout(timeout);}
}
function focusTitle(){app.querySelector('h1,h2')?.focus({preventScroll:true});}
function setup(){
 if(PRACTICE)return practiceSetup();
 busy=false;if(game?.phase!=='done')game=null;const finished=game?.phase==='done';
 screen('setup',`<div class="setup-wrap"><header class="brand"><img class="brand-logo" src="./assets/logo-saludo-10.png" width="54" height="54" alt="Silueta de un futbolista de espaldas, celebrando con el 10 en la camiseta"><span>MESSI<small>EL QUIZ ALBICELESTE</small></span><span class="stars">★ ★ ★</span></header>
 <h1 tabindex="-1">DIEZ CHANCES.<br><em>TODO POR EL 10.</em></h1>
 <p class="hook"><strong>125 preguntas. 10 vidas. 10 segundos para responder.</strong></p><p class="challenge">Cada error o tiempo agotado resta una vida. Si te quedás sin vidas, se termina la carrera.</p>
 <form id="setup-form"><label class="field-label" for="nickname">TU NOMBRE EN EL RANKING</label><input id="nickname" name="nickname" minlength="2" maxlength="20" required autocomplete="nickname" placeholder="¿Cómo te llaman?" value="${esc(finished?game.nickname:(saved.nickname||''))}" ${finished?'disabled':''}>
 <div class="earned-hook"><b>¿QUÉ MESSI SOS?</b><p>${tiers.length} versiones de Leo. Tu puntaje decide cuál sos.</p></div>
 <button class="primary" id="start" type="submit">${finished?'Ver mi resultado':'Arrancar partido'}</button><p class="error" id="setup-error" role="alert"></p></form>
 <button class="secondary" id="show-ranking">Ver ranking histórico</button><p class="menu-caption">Todos los jugadores y sus mejores resultados.</p></div>`);
 app.querySelector('#setup-form').onsubmit=async event=>{
  event.preventDefault();if(busy)return;if(finished){results(game);return;}if(!storageReady){app.querySelector('#setup-error').textContent='Activá el almacenamiento del navegador para guardar tus diez vidas y tu progreso.';return;}busy=true;
 const nickname=app.querySelector('#nickname').value.trim(),button=app.querySelector('#start');button.disabled=true;button.textContent='Entrando a la cancha…';
 if(!saved.pendingStart||saved.pendingStart.nickname!==nickname)saved.pendingStart={nickname,avatar:3,playerToken:saved.playerToken||crypto.randomUUID(),requestId:crypto.randomUUID()};persist();
 try{const data=await api('start',saved.pendingStart);saved={...saved,nickname,playerToken:data.playerToken,gameToken:data.gameToken};delete saved.pendingStart;persist();game=data;showGame(data);focusTitle();}
  catch(error){app.querySelector('#setup-error').textContent=error.message;button.disabled=false;button.textContent='Arrancar partido';}finally{busy=false;}
 };
 app.querySelector('#show-ranking').onclick=()=>showRanking();
}
function practiceSetup(){
 busy=false;game=null;delete saved.pendingAnswer;delete saved.gameToken;persist();
 screen('setup',`<section class="setup-wrap"><p class="eyebrow">MODO DE PRUEBA</p><h1 tabindex="-1">ELEGÍ LA<br><em>PREGUNTA.</em></h1><p class="hook">Podés empezar desde cualquiera y seguir jugando. Esta prueba tiene sus propias diez vidas y no guarda resultados en el ranking.</p><form id="practice-form"><label class="field-label" for="practice-number">PREGUNTA DE INICIO</label><input id="practice-number" type="number" min="1" max="125" step="1" value="${saved.practiceNumber||1}" required><p id="practice-preview" class="challenge"></p><button class="primary">Arrancar prueba</button></form><a class="link-button" href="./index.html">Volver al menú principal</a></section>`);
 const input=app.querySelector('#practice-number'),preview=app.querySelector('#practice-preview');
 const update=()=>{preview.textContent=orderedQuestions[Number(input.value)-1]?.question||'Elegí un número entre 1 y 125.';};input.oninput=update;update();
 app.querySelector('#practice-form').onsubmit=async event=>{event.preventDefault();saved.practiceNumber=Number(input.value);const data=await api('start',{number:saved.practiceNumber});saved.gameToken=data.gameToken;persist();showGame(data);focusTitle();};
}
function showGame(data){
 game=data;if(data.phase==='done')return results(data);if(data.phase==='ready')return readyScreen(data);
 const q=data.question;
 saved.review={number:data.number,question:q,choice:null};persist();
 questionScreen(data,q);
 if(!q.final){deadline=performance.now()+data.remainingMs;tick();timer=setInterval(tick,80);}
}
function questionScreen(data,q){
 screen('game',`<section class="game-wrap" data-question-id="${esc(q.id)}"><header class="game-top"><span>${PRACTICE?'PRUEBA · ':''}PREGUNTA <b>${data.number} / ${data.total}</b></span><span class="life"><b>${data.lives??10} VIDAS</b></span></header>
 ${balls(data.lives??10)}<div class="progress"><span style="width:${(data.number-1)/data.total*100}%"></span></div><div class="game-meta"><span>${esc(difficultyLabels[q.difficulty-1])}</span><span id="score">${aciertos(data.score)}</span></div>
 <div class="question-block">${q.final?'<p class="final-hint">LA ÚLTIMA VA POR AMOR AL 10 · TODAS SON CORRECTAS</p>':'<div class="clock" role="timer" aria-label="Tiempo restante"><b id="seconds">10</b><small>SEGUNDOS</small></div>'}<h2 tabindex="-1">${esc(q.text)}</h2></div>
 <div class="options">${q.options.map((option,i)=>`<button class="option" data-choice="${i}"><span class="letter" aria-hidden="true">${'ABCD'[i]}</span><span>${esc(option)}</span></button>`).join('')}</div>
 <footer class="game-bottom"><p id="status" aria-live="polite">Una respuesta. Jugátela.</p><button class="primary" id="next" disabled>Siguiente pregunta</button></footer></section>`);
 app.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>answer(Number(button.dataset.choice)));app.querySelector('#next').onclick=next;
 if(PRACTICE){const label=app.querySelector('.game-top>span');label.innerHTML=`<button class="practice-switch" title="Elegir otra pregunta">PRUEBA</button> · PREGUNTA <b>${data.number} / ${data.total}</b>`;label.querySelector('button').onclick=practiceSetup;}
}
function tick(){
 if(!game||game.phase!=='active'||game.question?.final||busy)return;
 const remaining=Math.max(0,deadline-performance.now()),seconds=app.querySelector('#seconds');if(seconds)seconds.textContent=Math.ceil(remaining/1000);
 app.querySelector('.clock')?.classList.toggle('urgent',remaining<=3000);if(remaining===0)answer(null);
}
async function answer(choice){
 if(busy||game?.phase!=='active')return;busy=true;stopTimer();const current=game;
 saved.review={number:current.number,question:current.question,choice};persist();
 app.querySelectorAll('[data-choice]').forEach(b=>{b.disabled=true;if(Number(b.dataset.choice)===choice)b.classList.add('chosen');});
 const status=app.querySelector('#status');status.textContent=choice===null?'Se acabó el tiempo…':'Respuesta elegida. Guardando tu elección…';
 app.querySelector('#next').textContent='Guardando respuesta…';
 const payload={gameToken:saved.gameToken,questionId:current.question.id,choice,value:choice===null?null:current.question.options[choice],elapsedMs:Math.max(0,10000-Math.max(0,deadline-performance.now()))};
 saved.pendingAnswer=payload;persist();
 await submitAnswer(payload);
}
async function submitAnswer(payload){
 busy=true;stopTimer();const status=app.querySelector('#status');
 let attempts=0;
 const send=async()=>{try{
  const data=await api('answer',payload);delete saved.pendingAnswer;persist();busy=false;if(data.phase==='active')showGame(data);else readyScreen(data);
 }catch(error){
  if(!error.retryable){delete saved.pendingAnswer;persist();busy=false;return restore();}
  if(error.retryable&&attempts++<2){status.textContent='Tu elección está guardada. Reintentando la confirmación…';return send();}
  busy=false;status.textContent=error.message;const button=app.querySelector('#next');button.textContent='Confirmar respuesta guardada';button.disabled=false;button.onclick=()=>{if(busy)return;busy=true;attempts=0;button.disabled=true;send();};}};
 await send();
}
function readyScreen(data){
 stopTimer();game=data;
 const item=data.question?{id:data.question.id,question:data.question.text,difficulty:data.question.difficulty,options:data.question.options,acceptAll:data.question.final}:orderedQuestions[data.answered-1],review=saved.review;
 if(!item)return results(data);
 // Keep the displayed shuffle and choice across retries and a reload while paused.
 const matches=review?.number===data.answered&&review.question?.id===item.id&&Array.isArray(review.question.options)&&review.question.options.length===4&&new Set(review.question.options).size===4&&review.question.options.every(option=>item.options.includes(option));
 const q={id:item.id,text:item.question,difficulty:item.difficulty,options:matches?review.question.options:item.options,final:!!item.acceptAll};
 // The saved server choice wins over a later tap, a retry or another tab.
 const recorded=Object.hasOwn(data,'acceptedValue');
 const localChoice=matches&&Number.isInteger(review.choice)?review.choice:null;
 const choice=recorded?(data.acceptedValue===null?null:q.options.indexOf(data.acceptedValue)):localChoice;
 const different=recorded&&localChoice!==null&&q.options[localChoice]!==data.acceptedValue;
 if(app.querySelector('.game-wrap')?.dataset.questionId!==String(q.id))questionScreen({...data,number:data.answered,total:orderedQuestions.length},q);
 const wrap=app.querySelector('.game-wrap');wrap.classList.add('answered');
 app.querySelector('.life b').textContent=`${data.lives} VIDAS`;
 app.querySelector('.lives').outerHTML=balls(data.lives);
 app.querySelector('#score').textContent=aciertos(data.score);
 app.querySelector('.progress span').style.width=`${data.answered/orderedQuestions.length*100}%`;
 app.querySelectorAll('[data-choice]').forEach(button=>{
  const index=Number(button.dataset.choice),selected=index===choice;
  const correct=selected?data.correct:(q.final||q.options[index]===data.answer);
  button.disabled=true;button.classList.remove('chosen','correct','incorrect');
  button.classList.toggle('chosen',selected);button.classList.toggle('correct',correct);button.classList.toggle('incorrect',selected&&!data.correct);
  button.setAttribute('aria-label',`${'ABCD'[index]}. ${q.options[index]}${selected?' · Tu respuesta':''}${correct?' · Correcta':selected?' · Incorrecta':''}`);
 });
 const clock=app.querySelector('.clock');if(clock){clock.classList.remove('urgent');clock.classList.add('paused');clock.setAttribute('role','status');clock.setAttribute('aria-label','Reloj detenido hasta la siguiente pregunta');clock.innerHTML='<b>PAUSA</b><small>AVANZÁ CUANDO QUIERAS</small>';}
 const status=app.querySelector('#status');status.className=data.correct?'success':'miss';
 status.textContent=(different?'Esta pregunta ya estaba respondida. ':'')+(data.correct?'¡Correcto!':`${data.lastReason==='timeout'?'Tiempo agotado':'Incorrecto'}. La correcta era: ${data.answer}.`);
 app.querySelector('.answer-explanation')?.remove();
 status.insertAdjacentHTML('afterend',`<details class="answer-explanation"><summary>Ver explicación</summary><p>${esc(data.explanation)}</p></details>`);
 const button=app.querySelector('#next');button.disabled=false;button.textContent=data.phase==='done'?'Ver mi resultado':'Siguiente pregunta';button.onclick=data.phase==='done'?()=>results(data):next;
}

async function next(){
 if(busy)return;busy=true;const button=app.querySelector('#next');button.disabled=true;button.textContent='Preparando pregunta…';
 try{const data=await api('next',{gameToken:saved.gameToken});busy=false;showGame(data);focusTitle();}
 catch(error){busy=false;app.querySelector('#status').textContent=error.message;button.disabled=false;button.textContent='Reconectar';button.onclick=restore;}
}
function rankingRows(data){return data.entries.length?data.entries.map((entry,i)=>`<li class="ranking-row ${entry.id===data.playerId?'you':''}"><b class="rank-position">${(data.startRank??1)+i}</b>${portrait(entry.score,'mini-avatar')}<span class="rank-name">${esc(entry.nickname)}${entry.id===data.playerId?' <small>VOS</small>':''}<span class="rank-tier">${tierForScore(entry.score).name}</span></span><strong>${entry.score}<small> ACIERTOS</small></strong></li>`).join(''):'<li class="empty-ranking">No hay récords en esta página.</li>';}
function results(data){
 busy=false;game=data;
 const tier=tierForScore(data.score);
 screen('result',`<section class="result-wrap ${data.score===125?'ultimate':''}"><header class="result-title"><p class="eyebrow result-status"><svg class="whistle" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 7h12v4h-5.5A6.5 6.5 0 1 1 9 7Z"/><circle cx="9" cy="13.5" r="2"/><path d="M14 7v4M17 2l-1 2M22 3l-2 2"/></svg><span>FIN DEL PARTIDO</span></p><h1 tabindex="-1">${tier.name.toUpperCase()}</h1></header>${portrait(data.score)}<p class="tier-copy">${tier.copy}</p>
 <div class="result-summary"><div><div class="result-score">${data.score}<span> / 125</span></div><p class="score-caption">ACIERTOS EN ESTA PARTIDA</p></div><div class="your-rank">${data.rankingPending?'<strong>Resultado guardado</strong><button class="link-button" id="refresh-result">Actualizar mi posición</button>':`<strong>#${data.rank}</strong><span>EN EL RANKING GLOBAL</span>`}</div></div>
 <button class="primary" id="full-ranking">Ver ranking global</button><footer class="result-footer"><button class="link-button" id="main-menu">Volver al menú principal</button><a class="photo-credit" href="${tier.source}" target="_blank" rel="noopener">Fuente de la foto</a></footer></section>`);
 app.querySelector('#full-ranking').onclick=()=>showRanking();
 app.querySelector('#main-menu').onclick=setup;
 if(PRACTICE){app.querySelector('.result-status span').textContent='FIN DE LA PRUEBA';app.querySelector('.your-rank').innerHTML='<strong>MODO DE PRUEBA</strong><span>NO SE GUARDA EN EL RANKING</span>';app.querySelector('#full-ranking').textContent='Elegir otra pregunta';app.querySelector('#full-ranking').onclick=practiceSetup;app.querySelector('#main-menu').onclick=()=>location.href='./index.html';}
 const refresh=app.querySelector('#refresh-result');if(refresh)refresh.onclick=async()=>{refresh.disabled=true;try{results(await api('state',{gameToken:saved.gameToken}));}catch{refresh.disabled=false;refresh.textContent='Volver a actualizar mi posición';}};
 if(refresh&&!PRACTICE){const current=app.querySelector('.result-wrap');api('state',{gameToken:saved.gameToken}).then(updated=>{if(app.querySelector('.result-wrap')===current&&!updated.rankingPending)results(updated);}).catch(()=>{});}
 focusTitle();
}
function rankingPageSize(){return Math.max(1,Math.min(20,Math.floor((Math.min(window.innerHeight,900)-280)/84)));}
async function showRanking(cursor=null,back=setup,previous=[]){
 screen('ranking','<section class="ranking-wrap"><p role="status">Buscando los récords…</p></section>');
 const generation=rankingGeneration;
 try{
  const pageSize=rankingPageSize(),params=new URLSearchParams({limit:String(pageSize),fresh:'1',_t:String(Date.now())});if(cursor)params.set('cursor',cursor);
  const data=await api('leaderboard',null,'?'+params);if(generation!==rankingGeneration)return;data.playerId=game?.playerId;
  screen('ranking',`<section class="ranking-wrap"><header><h1 tabindex="-1">RANKING HISTÓRICO</h1><p class="ranking-note">Histórico · ${data.total} ${data.total===1?'participante':'participantes'}</p><p class="ranking-range" role="status">${data.entries.length?`PUESTOS ${data.startRank??1}–${(data.startRank??1)+data.entries.length-1}`:'TODAVÍA NO HAY RÉCORDS'}</p></header><ol class="ranking">${rankingRows(data)}</ol><footer class="ranking-footer"><nav class="ranking-pages" aria-label="Páginas del ranking"><button class="page-button" id="previous-page" ${previous.length?'':'disabled'}>Anterior</button><button class="page-button" id="next-page" ${data.nextCursor?'':'disabled'}>Siguiente</button></nav><button class="link-button" id="refresh-ranking">Actualizar ranking</button><button class="primary" id="back">Volver al menú principal</button></footer></section>`);
  app.querySelector('#back').onclick=back;
  app.querySelector('#next-page').onclick=()=>showRanking(data.nextCursor,back,[...previous,cursor]);
  app.querySelector('#previous-page').onclick=()=>showRanking(previous.at(-1),back,previous.slice(0,-1));
  app.querySelector('#refresh-ranking').onclick=()=>showRanking(null,back);focusTitle();window.scrollTo(0,0);
  rankingResize=()=>{if(rankingPageSize()!==pageSize)showRanking(cursor,back,previous);};window.addEventListener('resize',rankingResize);
  rankingResume=()=>showRanking(null,back);
  if(!cursor)rankingRefresh=setInterval(()=>{if(!document.hidden)showRanking(null,back);},15000);
 }
 catch(error){if(generation===rankingGeneration)errorScreen(error,()=>showRanking(cursor,back,previous));}
}
function errorScreen(error,retry){screen('error',`<section class="ranking-wrap"><h1 tabindex="-1">VOLVAMOS A CONECTAR</h1><p class="hook" role="alert">${esc(error.message)}</p><button class="primary" id="retry">Reconectar</button><button class="link-button" id="home">Ir al inicio</button></section>`);app.querySelector('#retry').onclick=retry;app.querySelector('#home').onclick=()=>{delete saved.gameToken;persist();setup();};}
async function restore(){busy=false;screen('loading','<section class="ranking-wrap"><p role="status">Recuperando tu partida…</p></section>');try{
 if(saved.pendingAnswer){questionScreen({number:saved.review.number,total:125,score:0,lives:10},saved.review.question);return await submitAnswer(saved.pendingAnswer);}
 showGame(await api('state',{gameToken:saved.gameToken}));
 }catch(error){if(error.message.includes('El quiz se actualizó')){delete saved.gameToken;delete saved.pendingAnswer;persist();setup();}else errorScreen(error,restore);}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();rankingResume?.();}});
window.addEventListener('pageshow',event=>{if(event.persisted)rankingResume?.();});
if(!['/layout-check.html','/results-check.html','/screen-check.html'].some(path=>location.pathname.endsWith(path))){if(PRACTICE)practiceSetup();else if(saved.gameToken)restore();else setup();}
export { showGame, results, setup, readyScreen, showRanking };
