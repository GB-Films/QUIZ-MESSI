import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { questions, goalReference, orderedQuestions } from './dist/questions.js';
assert.equal(questions.length, goalReference.total);
assert.equal(new Set(questions.map(q => q.question)).size, 125);
for (const q of questions) {
  assert.equal(q.options.length, 4, `Cuatro opciones: ${q.id}`);
  assert.equal(new Set(q.options).size, 4, `Opciones distintas: ${q.id}`);
  assert.ok(q.options.includes(q.answer) && q.explanation.length > 10);
  assert.ok(Number.isInteger(q.difficulty) && q.difficulty >= 1 && q.difficulty <= 5);
}
assert.equal(new Set(orderedQuestions.map(q => q.id)).size, 125);
assert.ok(orderedQuestions.every((q, i) => !i || q.difficulty >= orderedQuestions[i - 1].difficulty), 'La dificultad solo aumenta');
assert.ok(!questions.some(q => /Barcelona|Barça|Inter Miami|PSG|Antonela|Newell|Balón de Oro de 2023/.test(q.question)), 'Solo preguntas de la Selección');
assert.equal(new Set(questions.map(q => q.category)).size, 5);
const html = await readFile('./dist/index.html', 'utf8');
for (const asset of ['style.css', 'app.js', 'questions.js', 'favicon.svg']) await readFile(`./dist/${asset}`);
assert.ok(html.includes('lang="es-AR"'));
console.log('125 preguntas únicas de la Selección, 4 opciones, dificultad creciente y recursos verificados.');
