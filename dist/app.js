import { questions, goalReference, orderedQuestions, difficultyLabels } from './questions.js';

const screen = document.querySelector('#screen');
const counter = document.querySelector('#counter');
const stageLabel = document.querySelector('#stage-label');
const storageKey = 'messi-quiz-125-seleccion-v3';
const rounds = orderedQuestions;
let answers = readProgress();
let options = [];

function readProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!Array.isArray(saved) || saved.length > rounds.length) return [];
    if (saved.some((a, i) => a.id !== rounds[i].id || !rounds[i].options.includes(a.selected))) return [];
    return saved;
  } catch { return []; }
}
function saveProgress() {
  try { localStorage.setItem(storageKey, JSON.stringify(answers)); } catch { /* El juego sigue si el navegador no admite almacenamiento. */ }
}
function score() { return answers.filter(a => questions[a.id - 1].answer === a.selected).length; }
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function focusHeading() { screen.querySelector('h2')?.focus({ preventScroll: true }); }
function startScreen() {
  stageLabel.textContent = 'EL DESAFÍO DEL 10';
  counter.textContent = `${goalReference.total} PREGUNTAS`;
  const complete = answers.length === rounds.length;
  screen.innerHTML = `<p class="start-kicker">DE HINCHA A EXPERTO</p>
    <h2 tabindex="-1">El desafío está<br>en la cancha.</h2>
    <p class="start-copy">125 preguntas sobre Leo con Argentina. Sus goles, sus partidos, las Copas América y los Mundiales que no se olvidan.</p>
    <div class="rules">
      <div class="rule"><span class="rule-number">01</span><span><strong>Cuatro opciones.</strong> Una respuesta correcta.</span></div>
      <div class="rule"><span class="rule-number">02</span><span><strong>De fácil a experto.</strong> La dificultad sube.</span></div>
      <div class="rule"><span class="rule-number">03</span><span><strong>Cada acierto suma.</strong> Llegá al final.</span></div>
    </div>
    <button class="primary" id="start">${complete ? 'Ver mi resultado' : answers.length ? 'Continuar el quiz' : 'Empezar el quiz'}</button>
    ${answers.length ? '<button class="secondary" id="restart">Empezar de nuevo</button>' : ''}
    <p class="small-note">${answers.length ? `${answers.length} de 125 respondidas · ${score()} aciertos` : 'Sin reloj. Tu avance se guarda en este dispositivo.'}</p>`;
  document.querySelector('#start').addEventListener('click', () => complete ? resultScreen() : questionScreen());
  document.querySelector('#restart')?.addEventListener('click', () => { answers = []; saveProgress(); questionScreen(); });
}
function questionScreen() {
  if (answers.length === rounds.length) return resultScreen();
  const item = rounds[answers.length];
  options = shuffle(item.options);
  stageLabel.textContent = 'UNA PREGUNTA POR CADA GOL';
  counter.textContent = `${answers.length + 1} / ${rounds.length}`;
  screen.innerHTML = `<div class="progress" role="progressbar" aria-label="Preguntas respondidas" aria-valuemin="0" aria-valuemax="125" aria-valuenow="${answers.length}"><span style="width:${answers.length / rounds.length * 100}%"></span></div>
    <div class="question-meta"><span class="category">${item.category}</span><span>${score()} aciertos</span></div>
    <div class="difficulty"><span aria-label="Nivel ${item.difficulty} de 5">${'●'.repeat(item.difficulty)}<span class="difficulty-empty">${'○'.repeat(5 - item.difficulty)}</span></span><span>${difficultyLabels[item.difficulty - 1]}</span></div>
    <h2 class="question-title" tabindex="-1">${item.question}</h2>
    <div class="options">${options.map((option, i) => `<button class="option" data-option="${i}"><span class="option-letter" aria-hidden="true">${'ABCD'[i]}</span><span>${option}</span></button>`).join('')}</div>
    <div id="feedback" aria-live="polite"></div>
    <div id="next-slot"></div>`;
  screen.querySelectorAll('.option').forEach(button => button.addEventListener('click', () => answerQuestion(Number(button.dataset.option), item)));
  focusHeading();
}
function answerQuestion(index, item) {
  if (answers.length >= rounds.length || rounds[answers.length].id !== item.id) return;
  const selected = options[index];
  const correct = selected === item.answer;
  answers.push({ id: item.id, selected });
  saveProgress();
  screen.querySelectorAll('.option').forEach((button, i) => {
    button.disabled = true;
    if (options[i] === item.answer) {
      button.classList.add('correct');
      button.insertAdjacentHTML('beforeend', '<span class="option-tag">CORRECTA</span>');
    } else if (i === index) {
      button.classList.add('wrong');
      button.insertAdjacentHTML('beforeend', '<span class="option-tag">TU ELECCIÓN</span>');
    }
  });
  screen.querySelector('#feedback').innerHTML = `<div class="feedback ${correct ? '' : 'missed'}"><strong>${correct ? '¡Golazo! Respuesta correcta.' : 'Esta se fue afuera.'}</strong>${item.explanation}</div>`;
  screen.querySelector('.question-meta').lastElementChild.textContent = `${score()} aciertos`;
  const progress = screen.querySelector('.progress');
  progress.setAttribute('aria-valuenow', answers.length);
  progress.firstElementChild.style.width = `${answers.length / rounds.length * 100}%`;
  screen.querySelector('#next-slot').innerHTML = `<button class="primary" id="next">${answers.length === rounds.length ? 'Ver mi resultado' : 'Siguiente pregunta'}</button>`;
  screen.querySelector('#next').addEventListener('click', questionScreen);
  screen.querySelector('#next').focus({ preventScroll: true });
}
function resultScreen() {
  const points = score();
  stageLabel.textContent = 'FINAL DEL PARTIDO';
  counter.textContent = '125 / 125';
  const title = points >= 110 ? '¡Sabés como el 10!' : points >= 85 ? 'Alma de campeón.' : points >= 60 ? 'Llevás la camiseta.' : 'Siempre del lado de Leo.';
  screen.innerHTML = `<p class="start-kicker">QUIZ COMPLETADO</p><h2 tabindex="-1">${title}</h2>
    <div class="result-number">${points}<span> / 125</span></div><p class="result-label">RESPUESTAS CORRECTAS · ${Math.round(points / 125 * 100)}%</p>
    <p class="start-copy">Recorriste 125 preguntas de Leo con Argentina. Estos son tus aciertos por tema:</p>
    <div class="results-breakdown">${[...new Set(questions.map(q => q.category))].map(category => {
      const count = answers.filter(a => questions[a.id - 1].category === category && questions[a.id - 1].answer === a.selected).length;
      return `<div class="result-row"><span>${category}</span><b>${count} / 25</b></div>`;
    }).join('')}</div><button class="primary" id="again">Volver a jugar</button>`;
  screen.querySelector('#again').addEventListener('click', () => { answers = []; saveProgress(); questionScreen(); });
  focusHeading();
}
startScreen();
