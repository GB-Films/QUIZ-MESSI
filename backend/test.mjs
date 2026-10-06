import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import worker from './index.js';
import {gameScenarios} from './game-scenarios.mjs';
const sqlite=new DatabaseSync(':memory:');
sqlite.exec(await readFile('drizzle/0000_misty_marvel_apes.sql','utf8'));
sqlite.exec(await readFile('drizzle/0001_ten_lives.sql','utf8'));
const DB={prepare(sql){return {bind(...values){const st=sqlite.prepare(sql);return {async first(){return st.get(...values)||null;},async all(){return {results:st.all(...values)};},async run(){return {meta:{changes:st.run(...values).changes}};}};}};}};
let now=1900000000000;const actualNow=Date.now;Date.now=()=>now;
async function post(action,body){const response=await worker.fetch(new Request('https://quiz.test/api/'+action,{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://gb-films.github.io'},body:JSON.stringify(body)}),{DB});return {status:response.status,...await response.json()};}
try{assert.equal((await post('start',{nickname:'<script>',avatar:3})).status,400);await gameScenarios(post,ms=>now+=ms);console.log('API SQLite y ranking verificados.');}finally{Date.now=actualNow;sqlite.close();}
