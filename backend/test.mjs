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
try{
 assert.equal((await post('start',{nickname:'<script>',avatar:3})).status,400);await gameScenarios(post,ms=>now+=ms);
 for(let i=0;i<45;i++)sqlite.prepare('INSERT INTO quiz_players (token_hash,public_id,nickname,avatar,version,score,elapsed_ms,updated_at) VALUES (?,?,?,?,?,?,?,?)').run('test-'+i,'rank-'+String(i).padStart(2,'0'),'Prueba '+i,3,'argentina-survival-1',i%3,500,now);
 const expected=sqlite.prepare('SELECT public_id FROM quiz_players WHERE score>=0 ORDER BY score DESC,elapsed_ms ASC,updated_at ASC,public_id ASC').all().map(r=>r.public_id);
 let cursor=null;const ids=[];
 do{const params=new URLSearchParams({limit:'7'});if(cursor)params.set('cursor',cursor);const response=await worker.fetch(new Request('https://quiz.test/api/leaderboard?'+params),{DB});assert.equal(response.status,200);const page=await response.json();assert.equal(page.startRank,ids.length+1);ids.push(...page.entries.map(r=>r.id));cursor=page.nextCursor;}while(cursor);
 assert.deepEqual(ids,expected,'SQL pages include every record once, including tied zero scores');
 assert.equal((await (await worker.fetch(new Request('https://quiz.test/api/leaderboard'),{DB})).json()).entries.length,5);
 console.log('API SQLite y ranking completo por páginas verificados.');
}finally{Date.now=actualNow;sqlite.close();}
