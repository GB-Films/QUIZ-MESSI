import { difficultyLabels } from './questions.js';
import { tiers, tierForScore } from './tiers.js';
const API=['127.0.0.1','localhost'].includes(location.hostname)?'/api':'https://messi-quiz-albiceleste.guidoboetsch.chatgpt.site/api';
const app=document.querySelector('#app'), KEY='messi-survival-v1';
let saved=readSaved(), game=null, timer=null, deadline=0, busy=false;
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const aciertos=n=>`${n} ${n===1?'acierto':'aciertos'}`;
function readSaved(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch{return {};}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(saved));}catch{}}
function stopTimer(){clearInterval(timer);timer=null;}
function screen(mode,html){stopTimer();document.body.dataset.screen=mode;app.innerHTML=html;}
function portrait(score,cls='portrait'){const a=tierForScore(score);return `<img class="${cls}" src="./assets/levels/${a.image}" alt="${esc(a.alt)}" title="${esc(a.name)}" style="object-position:${a.position};${cls==='portrait'&&a.fit?'object-fit:'+a.fit:''}" draggable="false">`;}
async function api(action,body){
 const sent=performance.now(),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(`${API}/${action}`,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:controller.signal});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'No se pudo conectar con el ranking.');
  if(data.remainingMs!==undefined)data.remainingMs=Math.max(0,data.remainingMs-(performance.now()-sent)/2);
  return data;
 }catch(error){if(error.name==='AbortError'||error instanceof TypeError)throw new Error('Se cortó la conexión. Reconectá para seguir. El reloj de la partida sigue corriendo.');throw error;}
 finally{clearTimeout(timeout);}
}
function focusTitle(){app.querySelector('h1,h2')?.focus({preventScroll:true});}
function setup(){
 busy=false;game=null;
 screen('setup',`<div class="setup-wrap"><header class="brand"><b>10</b><span>MESSI<small>EL QUIZ ALBICELESTE</small></span><span class="stars">★ ★ ★</span></header>
 <p class="eyebrow">125 PREGUNTAS · DE FÁCIL A EXPERTO</p><h1 tabindex="-1">UNA VIDA.<br><em>TODO POR EL 10.</em></h1>
 <p class="hook">Preparate. Concentrate. Tenés <strong>10 segundos por pregunta</strong> y una sola vida. Si fallás o se acaba el tiempo, termina tu partida.</p><p class="challenge">Demostrá cuánto sabés realmente de Messi con Argentina.</p>
 <form id="setup-form"><label class="field-label" for="nickname">TU NOMBRE EN EL RANKING</label><input id="nickname" name="nickname" minlength="2" maxlength="20" required autocomplete="nickname" placeholder="¿Cómo te llaman?" value="${esc(saved.nickname||'')}">
 <div class="earned-hook"><b>¿QUÉ MESSI SOS?</b><p>${tiers.length} versiones de Leo. Tu puntaje decide cuál sos.<br>De mirar desde el banco a besar la Copa. Y un último nivel para quien acierte las 125.</p></div>
 <p class="privacy">Tu nombre, personaje y mejor resultado serán públicos. Tu récord se reconoce en este navegador.</p><button class="primary" id="start" type="submit">Estoy listo. Vamos.</button><p class="error" id="setup-error" role="alert"></p></form>
 <button class="link-button" id="show-ranking">Ver ranking global</button><details class="credits"><summary>Sobre el quiz y las fotos</summary><p>Edición de 125 preguntas: <a href="https://www.afa.com.ar/es/posts/125-goles-207-partidos-y-una-historia-que-cambio-para-siempre-a-la-seleccion-argentina" target="_blank" rel="noopener">125 goles de Messi con Argentina según AFA</a>. Incluye Selección mayor, Sub-20 y Juegos Olímpicos. Quiz independiente.</p><p>Fotos y fuentes: ${tiers.map(a=>`<a href="${a.source}" target="_blank" rel="noopener">${a.name}</a>`).join(' · ')}. Créditos fotográficos en las fuentes enlazadas.</p><p>Ranking: mejor resultado por navegador. Ganan más aciertos; en un empate, menor tiempo acumulado. Si ambos coinciden, el récord alcanzado primero. La foto del ranking corresponde al récord, la del resultado a la partida recién jugada.</p></details></div>`);
 app.querySelector('#setup-form').onsubmit=async event=>{
  event.preventDefault();if(busy)return;busy=true;
 const nickname=app.querySelector('#nickname').value.trim(),button=app.querySelector('#start');button.disabled=true;button.textContent='Entrando a la cancha…';
 if(!saved.pendingStart||saved.pendingStart.nickname!==nickname)saved.pendingStart={nickname,avatar:3,playerToken:saved.playerToken||crypto.randomUUID(),requestId:crypto.randomUUID()};persist();
 try{const data=await api('start',saved.pendingStart);saved={...saved,nickname,playerToken:data.playerToken,gameToken:data.gameToken};delete saved.pendingStart;persist();game=data;showGame(data);focusTitle();}
  catch(error){app.querySelector('#setup-error').textContent=error.message;button.disabled=false;button.textContent='Estoy listo. Vamos.';}finally{busy=false;}
 };
 app.querySelector('#show-ranking').onclick=showRanking;
}
function showGame(data){
 game=data;if(data.phase==='done')return results(data);if(data.phase==='ready')return readyScreen(data);
 const q=data.question;
 screen('game',`<section class="game-wrap"><header class="game-top"><span>PREGUNTA <b>${data.number} / ${data.total}</b></span><span class="life">♥ <b>1 VIDA</b></span></header>
 <div class="progress"><span style="width:${data.score/data.total*100}%"></span></div><div class="game-meta"><span>${esc(difficultyLabels[q.difficulty-1])}</span><span id="score">${aciertos(data.score)}</span></div>
 <div class="question-block"><div class="clock" role="timer" aria-label="Tiempo restante"><b id="seconds">10</b><small>SEGUNDOS</small></div><h2 tabindex="-1">${esc(q.text)}</h2></div>
 <div class="options">${q.options.map((option,i)=>`<button class="option" data-choice="${i}"><span class="letter" aria-hidden="true">${'ABCD'[i]}</span><span>${esc(option)}</span></button>`).join('')}</div>
 <footer class="game-bottom"><p id="status" aria-live="polite">Una respuesta. Jugátela.</p><button class="primary" id="next" disabled>Siguiente pregunta</button></footer></section>`);
 app.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>answer(Number(button.dataset.choice)));app.querySelector('#next').onclick=next;
 deadline=performance.now()+data.remainingMs;tick();timer=setInterval(tick,80);
}
function tick(){
 if(!game||game.phase!=='active'||busy)return;
 const remaining=Math.max(0,deadline-performance.now()),seconds=app.querySelector('#seconds');if(seconds)seconds.textContent=Math.ceil(remaining/1000);
 app.querySelector('.clock')?.classList.toggle('urgent',remaining<=3000);if(remaining===0)answer(null);
}
async function answer(choice){
 if(busy||game?.phase!=='active')return;busy=true;stopTimer();const current=game;
 app.querySelectorAll('[data-choice]').forEach(b=>{b.disabled=true;if(Number(b.dataset.choice)===choice)b.classList.add('chosen');});
 const status=app.querySelector('#status');status.textContent=choice===null?'Se acabó el tiempo…':'Comprobando tu respuesta…';
 const payload={gameToken:saved.gameToken,questionId:current.question.id,choice,value:choice===null?null:current.question.options[choice]};
 const send=async()=>{try{
  const data=await api('answer',payload);busy=false;if(data.phase==='done')return results(data);if(data.phase==='active')return showGame(data);game=data;
  app.querySelector('.chosen')?.classList.add('correct');app.querySelector('#score').textContent=aciertos(data.score);status.textContent='¡Golazo! Respuesta correcta.';status.classList.add('success');
  const button=app.querySelector('#next');button.disabled=false;button.onclick=next;button.focus({preventScroll:true});
 }catch(error){busy=false;status.textContent=error.message;const button=app.querySelector('#next');button.textContent='Reconectar';button.disabled=false;button.onclick=()=>{if(busy)return;busy=true;button.disabled=true;send();};}};
 await send();
}
function readyScreen(data){game=data;screen('game',`<section class="game-wrap ready-wrap"><p class="eyebrow">EL DESAFÍO SIGUE</p><h2 tabindex="-1">¡GOLAZO!</h2><p>${data.score} aciertos. Una vida.</p><footer class="game-bottom"><p id="status" aria-live="polite">Concentrate para la próxima.</p><button class="primary" id="next">Siguiente pregunta</button></footer></section>`);app.querySelector('#next').onclick=next;}
async function next(){
 if(busy)return;busy=true;const button=app.querySelector('#next');button.disabled=true;button.textContent='Preparando pregunta…';
 try{const data=await api('next',{gameToken:saved.gameToken});busy=false;showGame(data);focusTitle();}
 catch(error){busy=false;app.querySelector('#status').textContent=error.message;button.disabled=false;button.textContent='Reconectar';button.onclick=restore;}
}
function rankingRows(data){return data.entries.length?data.entries.map((entry,i)=>`<li class="ranking-row ${entry.id===data.playerId?'you':''}"><b class="rank-position">${i+1}</b>${portrait(entry.score,'mini-avatar')}<span class="rank-name">${esc(entry.nickname)}${entry.id===data.playerId?' <small>VOS</small>':''}<span class="rank-tier">${tierForScore(entry.score).name}</span></span><strong>${entry.score}<small> ACIERTOS</small></strong></li>`).join(''):'<li class="empty-ranking">La cancha está vacía. ¡Sé el primero!</li>';}
function results(data){
 busy=false;game=data;
 const tier=tierForScore(data.score),level=tiers.indexOf(tier),nextTier=tiers[level+1];
 screen('result',`<section class="result-wrap ${data.score===125?'ultimate':''}"><p class="eyebrow">${data.score===125?'125 DE 125 · EL NIVEL DEFINITIVO':'TU RESULTADO: SOS'}</p><h1 tabindex="-1">${tier.name.toUpperCase()}</h1><p class="tier-era">${tier.era} · NIVEL ${level+1}/${tiers.length}</p>${portrait(data.score)}<p class="tier-copy">${tier.copy}</p><h2 class="player-name">${esc(data.nickname)}</h2>
 <p class="end-reason">${data.reason==='timeout'?'Se acabaron los 10 segundos.':data.reason==='wrong'?'Un error. Se terminó tu vida.':'125 respuestas. Una historia de campeón.'}</p><div class="result-score">${data.score}<span> / 125</span></div><p class="score-caption">ACIERTOS EN ESTA PARTIDA</p>
 <div class="your-rank"><strong>${data.rankingPending?'TU RESULTADO ESTÁ GUARDADO':`#${data.rank} EN EL RANKING GLOBAL`}</strong><span>TU RÉCORD: ${aciertos(data.bestScore).toUpperCase()}${data.total===null?'':` · ${data.total} ${data.total===1?'JUGADOR':'JUGADORES'}`}</span></div>
 ${nextTier?`<p class="next-tier">${aciertos(nextTier.min-data.score)} más y eras <b>${nextTier.name}</b>.</p>`:'<p class="next-tier">Llegaste al último nivel. La heladería es tuya.</p>'}
 <div class="ranking-heading"><h3>LOS 5 DEL 10</h3><span>RÉCORDS GLOBALES</span></div>${data.rankingPending?'<p class="ranking-note">Tu partida quedó guardada. El ranking está tardando en responder.</p><button class="link-button" id="refresh-result">Actualizar mi posición</button>':`<ol class="ranking">${rankingRows(data)}</ol><p class="ranking-note">Tu posición corresponde a tu mejor partida. Empates: menor tiempo de respuesta.</p>`}
 <button class="primary" id="again">Prepararme y volver a jugar</button><button class="link-button" id="share">Compartir mi resultado</button><p class="share-status" id="share-status" aria-live="polite"></p><a class="photo-credit" href="${tier.source}" target="_blank" rel="noopener">Fuente de la foto</a></section>`);
 app.querySelector('#again').onclick=()=>{delete saved.gameToken;persist();setup();focusTitle();};
 const refresh=app.querySelector('#refresh-result');if(refresh)refresh.onclick=async()=>{refresh.disabled=true;try{results(await api('state',{gameToken:saved.gameToken}));}catch{refresh.disabled=false;refresh.textContent='Volver a actualizar mi posición';}};
 app.querySelector('#share').onclick=async()=>{
  const text=`Soy ${tier.name}: ${data.score}/125 aciertos en el quiz de Messi 🇦🇷.${data.rankingPending?'':` Mi récord está #${data.rank} en el ranking global.`} Una vida. 10 segundos por pregunta. ¿Qué Messi sos vos?`;
  try{if(navigator.share)await navigator.share({title:'El desafío del 10',text,url:location.href});else{await navigator.clipboard.writeText(`${text}\n${location.href}`);app.querySelector('#share-status').textContent='Resultado copiado para compartir.';}}
  catch(error){if(error.name!=='AbortError')app.querySelector('#share-status').textContent='No se pudo compartir. Copiá el enlace de esta página.';}
 };focusTitle();
}
async function showRanking(){
 screen('ranking','<section class="ranking-wrap"><p role="status">Buscando los récords…</p></section>');
 try{const data=await api('leaderboard');screen('ranking',`<section class="ranking-wrap"><p class="eyebrow">EL DESAFÍO DEL 10</p><h1 tabindex="-1">RANKING GLOBAL</h1><p class="ranking-note">Los mejores resultados de ${data.total} ${data.total===1?'jugador':'jugadores'}.</p><ol class="ranking">${rankingRows(data)}</ol><button class="primary" id="back">Volver y prepararme</button></section>`);app.querySelector('#back').onclick=setup;focusTitle();}
 catch(error){errorScreen(error,showRanking);}
}
function errorScreen(error,retry){screen('error',`<section class="ranking-wrap"><h1 tabindex="-1">VOLVAMOS A CONECTAR</h1><p class="hook" role="alert">${esc(error.message)}</p><button class="primary" id="retry">Reconectar</button><button class="link-button" id="home">Ir al inicio</button></section>`);app.querySelector('#retry').onclick=retry;app.querySelector('#home').onclick=()=>{delete saved.gameToken;persist();setup();};}
async function restore(){busy=false;screen('loading','<section class="ranking-wrap"><p role="status">Recuperando tu partida…</p></section>');try{showGame(await api('state',{gameToken:saved.gameToken}));}catch(error){errorScreen(error,restore);}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
if(!['/layout-check.html','/results-check.html'].some(path=>location.pathname.endsWith(path))){if(saved.gameToken)restore();else setup();}
export { showGame, results };
