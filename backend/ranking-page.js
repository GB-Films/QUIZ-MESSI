import { fail } from './quiz-rules.js';

export function parseRankingPage(params) {
  if (!params.has('limit') && !params.has('cursor')) return null;
  const raw = params.get('limit') ?? '20';
  if (!/^\d{1,2}$/.test(raw) || Number(raw)<1 || Number(raw)>50) fail('Página de ranking inválida.');
  let after=null, offset=0;
  if (params.has('cursor')) {
    const cursor=params.get('cursor');
    try {
      if (!/^[A-Za-z0-9_-]{1,320}$/.test(cursor)) throw new Error();
      const data=JSON.parse(atob(cursor.replace(/-/g,'+').replace(/_/g,'/')));
      if (!/^\d{3}:\d{7}:\d{13}:[A-Za-z0-9-]{1,80}$/.test(data.key) || !Number.isSafeInteger(data.offset) || data.offset<1) throw new Error();
      after=data.key;offset=data.offset;
    } catch { fail('Página de ranking inválida.'); }
  }
  return {limit:Number(raw),after,offset};
}

export const rankingKey = entry => `${String(125-entry.score).padStart(3,'0')}:${String(entry.elapsedMs).padStart(7,'0')}:${String(entry.updatedAt).padStart(13,'0')}:${entry.id}`;

export function rankingPageResult(rows,total,page) {
  const entries=rows.slice(0,page.limit);
  const last=entries.at(-1);
  const nextCursor=rows.length>page.limit && last ? btoa(JSON.stringify({key:last.orderKey??rankingKey(last),offset:page.offset+entries.length})).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_') : null;
  return {entries:entries.map(({id,nickname,avatar,score,elapsedMs})=>({id,nickname,avatar,score,elapsedMs})),total,startRank:page.offset+1,nextCursor};
}
