import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import worker from './index.js';
const sqlite=new DatabaseSync(':memory:');
sqlite.exec(await readFile('drizzle/0000_misty_marvel_apes.sql','utf8'));
sqlite.exec(await readFile('drizzle/0001_ten_lives.sql','utf8'));
const DB={prepare(sql){return {bind(...values){const st=sqlite.prepare(sql);return {async first(){return st.get(...values)||null;},async all(){return {results:st.all(...values)};},async run(){return {meta:{changes:st.run(...values).changes}};}};}};}};
const root=resolve('dist');
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:4173');
  if(url.pathname.startsWith('/api/')){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const response=await worker.fetch(new Request(url,{method:req.method,headers:req.headers,body:req.method==='POST'?Buffer.concat(chunks):undefined}),{DB});
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  if(url.pathname==='/layout-check.html'){
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
   res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><main id="app"></main><script type="module">
import {showGame} from '/app.js';import {orderedQuestions} from '/questions.js';
await document.fonts.ready;const failures=[];
for(const q of orderedQuestions){showGame({phase:'active',score:0,lives:10,number:125,total:125,remainingMs:3600000,question:{id:q.id,text:q.question,difficulty:q.difficulty,options:q.options,final:!!q.acceptAll}});await new Promise(requestAnimationFrame);
const title=document.querySelector('h2').getBoundingClientRect(),options=document.querySelector('.options').getBoundingClientRect(),next=document.querySelector('#next').getBoundingClientRect();
if(document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth||title.bottom>options.top||next.bottom>innerHeight)failures.push({id:q.id,titleBottom:title.bottom,optionsTop:options.top,nextBottom:next.bottom});}
document.querySelector('#status').textContent=failures.length?'ERRORES: '+JSON.stringify(failures):'125 PREGUNTAS VERIFICADAS: SIN SCROLL';
</script></body></html>`);return;
  }
  if(url.pathname==='/screen-check.html'){
   // Datos ficticios sólo en la base en memoria de la vista previa.
   for(let i=0;i<37;i++)sqlite.prepare('INSERT OR IGNORE INTO quiz_players (token_hash,public_id,nickname,avatar,version,score,elapsed_ms,updated_at) VALUES (?,?,?,?,?,?,?,?)').run('screen-check-'+i,'screen-check-'+String(i).padStart(2,'0'),'Prueba de pantalla '+i,3,'argentina-survival-1',Math.max(0,125-i*4),500,1900000000000+i);
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile('backend/screen-check.html'));return;
  }
  if(url.pathname==='/results-check.html'){
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
   res.end(`<!doctype html><html lang="es-AR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><main id="app"></main><script type="module">
import {results} from '/app.js';import {tiers} from '/tiers.js';
const score=Math.min(125,Math.max(0,Math.trunc(Number(new URL(location.href).searchParams.get('score'))||0)));
const entries=tiers.slice().reverse().map((t,i)=>({id:i===0?'preview':'preview-'+i,nickname:i===0?'Vista de prueba':'Prueba '+(tiers.length-i),score:t.max}));
results({phase:'done',lives:score===125?10:0,reason:score===125?'complete':'lives',score,nickname:'Vista de prueba',rank:1,bestScore:125,total:10,playerId:'preview',entries:entries.slice(0,5)});
document.querySelector('.result-title .eyebrow').textContent='VISTA DE PRUEBA · FIN DEL PARTIDO';
</script></body></html>`);return;
  }
  const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
  const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch(error){res.writeHead(404);res.end(error.message);}
}).listen(4173,'127.0.0.1',()=>console.log('Vista previa con ranking de prueba: http://127.0.0.1:4173/'));
