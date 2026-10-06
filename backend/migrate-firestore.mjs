import { readFile } from 'node:fs/promises';
import { createFirebaseRanking, createFirestoreClient, documentWrite, unpack } from './firestore.js';
import { VERSION } from './index.js';

const [recordsPath, credentialPath, mode] = process.argv.slice(2);
if (!recordsPath || !credentialPath) throw new Error('Uso: node backend/migrate-firestore.mjs <jugadores-exportados.json> <cuenta-de-servicio.json>');
if(mode&&mode!=='--refresh-games-before-cutover')throw new Error('Opción de migración inválida.');
if(mode){
  const paused=await fetch('https://messi-quiz-albiceleste.guidoboetsch.chatgpt.site/api/start?migration='+Date.now(),{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(8000)});
  if(paused.status!==503||(await paused.json()).error!=='Estamos actualizando el guardado. Intentá nuevamente en un momento.')throw new Error('La actualización de partidas requiere el servidor pausado antes del cambio.');
}
const credential = JSON.parse(await readFile(credentialPath,'utf8'));
const exported = JSON.parse(await readFile(recordsPath,'utf8'));
const records = Array.isArray(exported)?exported:exported.players;
const games = Array.isArray(exported)?[]:exported.games||[];
if (!Array.isArray(records)||!Array.isArray(games)) throw new Error('La exportación debe contener jugadores y, opcionalmente, partidas.');
const eligible = records.filter(player=>player.version===VERSION&&player.score>=0);
for (const player of eligible) {
  if (!/^[a-f0-9-]{36}$/i.test(player.public_id) || typeof player.nickname!=='string' || !Number.isInteger(player.score) || player.score>125 || !Number.isInteger(player.elapsed_ms) || player.elapsed_ms<0 || !Number.isInteger(player.updated_at) || !Number.isInteger(player.avatar)) throw new Error('La exportación contiene un récord inválido.');
}
const env={FIREBASE_PROJECT_ID:credential.project_id,FIREBASE_CLIENT_EMAIL:credential.client_email,FIREBASE_PRIVATE_KEY:credential.private_key,FIREBASE_API_KEY:credential.api_key,FIREBASE_REFRESH_TOKEN:credential.refresh_token};
const ranking = createFirebaseRanking(env,VERSION);
const {root,request}=createFirestoreClient(env);
for (const player of records.filter(player=>player.version===VERSION)) {
  if (player.token_hash) {
    if(!/^[a-f0-9]{64}$/i.test(player.token_hash))throw new Error('Identificador de jugador inválido.');
    const path=`${root}/quizPlayerVersions/${VERSION}/identities/${player.token_hash}`;
    const before=await request(path,undefined,true);
    if(before&&unpack(before).public_id!==player.public_id)throw new Error('La identidad ya existe con otro ID. Reconciliar antes de cambiar el servidor.');
    const current=before?unpack(before):null;
    if(!current||current.score<player.score||(current.score===player.score&&current.elapsed_ms>player.elapsed_ms))await request(`${root}:commit`,{writes:[documentWrite(path,player,before)]});
  }
  if(player.score>=0)await ranking.saveBest(player);
}
let importedGames=0;
for(const game of games.filter(game=>game.version===VERSION)){
  if(!/^[a-f0-9-]{36}$/i.test(game.id)||!/^[a-f0-9]{64}$/i.test(game.player_hash)||!['active','ready','done'].includes(game.phase))throw new Error('La exportación contiene una partida inválida.');
  const path=`${root}/quizGameVersions/${VERSION}/games/${game.id}`;
  const before=await request(path,undefined,true);
  if(!before||mode){await request(`${root}:commit`,{writes:[documentWrite(path,game,before)]});importedGames++;}
}
console.log(`${eligible.length} récords sincronizados; ${importedGames} partidas importadas. Se conservan resultados mejores e identidades existentes.`);
