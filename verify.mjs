import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { questions, goalReference, orderedQuestions } from './dist/questions.js';
import { tiers, tierForScore } from './dist/tiers.js';
assert.equal(questions.length, goalReference.total);
assert.equal(new Set(questions.map(q => q.question.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').replace(/[^a-z0-9]/g,''))).size, 125);
assert.equal(orderedQuestions.at(-1).id,50);
assert.equal(orderedQuestions.filter(q=>q.acceptAll).length,1);
assert.ok(orderedQuestions.at(-1).acceptAll);
assert.equal(orderedQuestions[0].id,68);
assert.equal(orderedQuestions[0].answer,'17');
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
assert.equal(tiers.length, 22);
assert.equal(new Set(tiers.map(t => t.image)).size, 22);
for (let score=0;score<=125;score++) {
 assert.equal(tiers.filter(t => score>=t.min && score<=t.max).length,1,`Un solo nivel para ${score} aciertos`);
 assert.ok(tierForScore(score));
}
assert.equal(tierForScore(0).name,'Messi en el banco');
assert.equal(tierForScore(111).name,'Messi de rodillas');
assert.equal(tierForScore(115).name,'Messi campeón del mundo');
assert.equal(tierForScore(89).name,'Messi de Wembley');
assert.equal(tierForScore(104).name,'Messi «andá pa’ allá, bobo»');
assert.equal(tierForScore(105).name,'Messi de la remontada');
assert.equal(tierForScore(110).name,'Messi de la remontada');
assert.equal(tierForScore(123).name,'Messi campeón del mundo');
assert.equal(tierForScore(124).name,'Messi de la última final');
assert.equal(tierForScore(124).min,124);
assert.equal(tierForScore(124).max,124);
assert.equal(tierForScore(125).name,'Messi 2012');
assert.equal(tiers.at(-1).min,125);
for (const t of tiers) assert.ok((await readFile(`./dist/assets/levels/${t.image}`)).length>1000,`Foto existente: ${t.name}`);
for (const score of [-1,126,1.5,NaN]) assert.throws(()=>tierForScore(score),RangeError);
console.log('125 preguntas verificadas. Veintidós fotos y todos los niveles de 0 a 125; plata exclusiva de 124 y Messi 2012 exclusivo de 125 aciertos.');
