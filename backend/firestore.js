import { rankingPageResult } from './ranking-page.js';
// Firebase credentials stay on the server. The browser only uses the quiz API.
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
let cachedToken;
let pendingToken;
let firebaseToken;
let pendingFirebaseToken;
const reads = new Map();
async function cachedRead(key, ttl, operation) {
  if (!ttl) return operation();
  const current=reads.get(key);
  if(current&&current.expiresAt>Date.now())return current.promise;
  if(reads.size>=1024)reads.delete(reads.keys().next().value);
  const promise=operation().catch(error=>{if(reads.get(key)?.promise===promise)reads.delete(key);throw error;});
  reads.set(key,{promise,expiresAt:Date.now()+ttl});
  return promise;
}
const encode = value => btoa(String.fromCharCode(...new TextEncoder().encode(value))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const field = value => value === null ? {nullValue: null} : typeof value === 'boolean' ? {booleanValue:value} : Number.isInteger(value) ? {integerValue: String(value)} : {stringValue: value};
export const unpack = doc => Object.fromEntries(Object.entries(doc.fields).map(([key, value]) => [key, value.integerValue !== undefined ? Number(value.integerValue) : 'nullValue' in value ? null : value.booleanValue ?? value.stringValue]));
export const documentWrite = (name, data, previous) => ({update:{name,fields:Object.fromEntries(Object.entries(data).map(([key,value])=>[key,field(value)]))}, currentDocument:previous?{updateTime:previous.updateTime}:{exists:false}});
export const isConflict = error => ['ABORTED','FAILED_PRECONDITION','ALREADY_EXISTS'].includes(error.firebaseStatus);

export function firebaseEnabled(env) {
  return Boolean(env.FIREBASE_PROJECT_ID || env.FIREBASE_CLIENT_EMAIL || env.FIREBASE_PRIVATE_KEY || env.FIREBASE_REFRESH_TOKEN);
}

async function accessToken(env) {
  // Cloud Functions uses its managed service identity, avoiding a downloaded key.
  if (env.FIREBASE_AUTH) return env.FIREBASE_AUTH();
  if (env.FIREBASE_REFRESH_TOKEN) return refreshFirebaseToken(env);
  const {FIREBASE_PROJECT_ID: project, FIREBASE_CLIENT_EMAIL: email, FIREBASE_PRIVATE_KEY: pem} = env;
  if (!project || !email || !pem) throw new Error('Incomplete Firebase server configuration');
  if (cachedToken?.email === email && cachedToken.pem === pem && cachedToken.expiresAt > Date.now() + 60000) return cachedToken.value;
  if (pendingToken?.email === email && pendingToken.pem === pem) return pendingToken.promise;
  const promise = mintToken(email, pem).finally(() => { if (pendingToken?.promise === promise) pendingToken = null; });
  pendingToken = {email, pem, promise};
  return promise;
}

async function refreshFirebaseToken(env) {
  const {FIREBASE_API_KEY:apiKey,FIREBASE_REFRESH_TOKEN:refresh} = env;
  if(!apiKey||!env.FIREBASE_PROJECT_ID)throw new Error('Incomplete Firebase server configuration');
  if(firebaseToken?.refresh===refresh&&firebaseToken.apiKey===apiKey&&firebaseToken.expiresAt>Date.now()+60000)return firebaseToken.value;
  if(pendingFirebaseToken?.refresh===refresh&&pendingFirebaseToken.apiKey===apiKey)return pendingFirebaseToken.promise;
  const promise=(async()=>{
    const response=await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(apiKey)}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:refresh}),signal:AbortSignal.timeout(8000)});
    const data=await response.json();
    if(!response.ok||!data.id_token)throw new Error('Firebase server authentication failed');
    firebaseToken={apiKey,refresh,value:data.id_token,expiresAt:Date.now()+Number(data.expires_in)*1000};
    return data.id_token;
  })().finally(()=>{if(pendingFirebaseToken?.promise===promise)pendingFirebaseToken=null;});
  pendingFirebaseToken={apiKey,refresh,promise};
  return promise;
}

async function mintToken(email, pem) {
  const now = Math.floor(Date.now() / 1000);
  const input = `${encode(JSON.stringify({alg: 'RS256', typ: 'JWT'}))}.${encode(JSON.stringify({iss: email, scope: 'https://www.googleapis.com/auth/datastore', aud: TOKEN_URL, iat: now, exp: now + 3600}))}`;
  const der = Uint8Array.from(atob(pem.replace(/\\n/g, '\n').replace(/-----[^-]+-----|\s/g, '')), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input)));
  const signature = btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const response = await fetch(TOKEN_URL, {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams({grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${input}.${signature}`}), signal: AbortSignal.timeout(8000)});
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error('Firebase server authentication failed');
  cachedToken = {email, pem, value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000};
  return data.access_token;
}

export function createFirestoreClient(env) {
  const root = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
  async function request(path, body, allowMissing = false) {
    const response = await fetch(`https://firestore.googleapis.com/v1/${path}`, {method: body ? 'POST' : 'GET', headers: {Authorization: `Bearer ${await accessToken(env)}`, 'Content-Type': 'application/json'}, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(8000)});
    if (allowMissing && response.status === 404) return null;
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(`Firestore request failed (${response.status})`), {firebaseStatus: data.error?.status});
    return data;
  }
  return {root,request};
}

export function createFirebaseRanking(env, version) {
  const {root,request} = createFirestoreClient(env);
  const parent = `${root}/quizRankings/${version}`;
  const ttl=env.FIREBASE_CACHE_MS===undefined?15000:Math.max(0,Math.min(60000,Number(env.FIREBASE_CACHE_MS)||0));
  const query = extra => ({from: [{collectionId: 'players'}], ...extra});
  const publicEntry = entry => ({id: entry.id, nickname: entry.nickname, avatar: entry.avatar, score: entry.score, elapsedMs: entry.elapsedMs});
  // One indexed string expresses the complete tie-break order, avoiding composite indexes.
  const orderKey = entry => `${String(125 - entry.score).padStart(3, '0')}:${String(entry.elapsedMs).padStart(7, '0')}:${String(entry.updatedAt).padStart(13, '0')}:${entry.id}`;
  async function count(where,fresh=false) {
    return cachedRead(`${parent}:count:${JSON.stringify(where||null)}`,fresh?0:ttl,async()=>{
      const rows = await request(`${parent}:runAggregationQuery`, {structuredAggregationQuery: {structuredQuery: query(where ? {where} : {}), aggregations: [{alias: 'total', count: {}}]}});
      return Number(rows[0]?.result?.aggregateFields?.total?.integerValue || 0);
    });
  }
  return {
    async leaderboard(page=null,fresh=false) {
      if (page) return cachedRead(`${parent}:page:${page.limit}:${page.after}:${page.offset}`,fresh?0:ttl,async()=>{
        const [rows,total]=await Promise.all([
          request(`${parent}:runQuery`,{structuredQuery:query({orderBy:[{field:{fieldPath:'orderKey'},direction:'ASCENDING'}],limit:page.limit+1,...(page.after?{startAt:{values:[{stringValue:page.after}],before:false}}:{})})}),count(undefined,fresh)
        ]);
        return rankingPageResult(rows.filter(row=>row.document).map(row=>unpack(row.document)),total,page);
      });
      return cachedRead(`${parent}:leaderboard`,fresh?0:ttl,async()=>{
        const [rows, total] = await Promise.all([
          request(`${parent}:runQuery`, {structuredQuery: query({orderBy: [{field: {fieldPath: 'orderKey'}, direction: 'ASCENDING'}], limit: 5})}), count(undefined,fresh)
        ]);
        return {entries: rows.filter(row => row.document).map(row => publicEntry(unpack(row.document))), total};
      });
    },
    async saveBest(player) {
      const entry = {id: player.public_id, nickname: player.nickname, avatar: player.avatar, score: player.score, elapsedMs: player.elapsed_ms, updatedAt: player.updated_at};
      entry.orderKey = orderKey(entry);
      const path = `${parent}/players/${entry.id}`;
      for (let attempt = 0; attempt < 5; attempt++) {
        const previous = await request(path, undefined, true);
        if (previous && unpack(previous).orderKey <= entry.orderKey) return unpack(previous);
        try {
          await request(`${root}:commit`, {writes: [documentWrite(path,entry,previous)]});
          return entry;
        } catch (error) {
          if (!isConflict(error)) throw error;
        }
      }
      throw new Error('Firebase ranking is busy; retry the finished game');
    },
    async rank(entry) {
      return 1 + await count({fieldFilter: {field: {fieldPath: 'orderKey'}, op: 'LESS_THAN', value: {stringValue: entry.orderKey}}});
    }
  };
}
