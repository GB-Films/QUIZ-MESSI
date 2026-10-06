import { orderedQuestions } from '../dist/questions.js';
import { VERSION, TIME, RULES_VERSION, uuidPattern, digest, fail, cleanName, publicGame, deviceGameId, newGame, readyGame, feedback, expired, applyAnswer } from './quiz-rules.js';
import { createFirestoreClient, createFirebaseRanking, documentWrite, unpack, isConflict } from './firestore.js';

// Each game and player has its own randomly distributed document. No shared SQL writer.
export function createFirebaseGames(env) {
  const {root,request} = createFirestoreClient(env);
  const ranking = createFirebaseRanking(env,VERSION);
  const gamePath = id => `${root}/quizGameVersions/${VERSION}/games/${id}`;
  const playerPath = hash => `${root}/quizPlayerVersions/${VERSION}/identities/${hash}`;
  const get = path => request(path,undefined,true);
  const commit = writes => request(`${root}:commit`,{writes});
  async function retry(operation) {
    for (let attempt=0;attempt<5;attempt++) {
      try { return await operation(); } catch(error) {
        if (!isConflict(error)) throw error;
        if (attempt<4) await new Promise(resolve=>setTimeout(resolve,10+Math.random()*40));
      }
    }
    fail('La partida está ocupada. Reconectá para recuperar tu resultado.',503);
  }
  async function result(game) {
    const player = unpack(await get(playerPath(game.player_hash)));
    const base = {phase:'done',score:game.score,elapsedMs:game.elapsed_ms,reason:game.reason,avatar:game.avatar,nickname:game.nickname,bestScore:player.score,playerId:player.public_id,resultSaved:true,...feedback(game)};
    // A ranking read outage must never hide a result already atomically saved to Firebase.
    try {
      const doc = await get(`${root}/quizRankings/${VERSION}/players/${player.public_id}`);
      const best = unpack(doc);
      const [rank,board] = await Promise.all([ranking.rank(best),ranking.leaderboard()]);
      return {...base,rank,...board};
    } catch {
      return {...base,rank:null,entries:[],total:null,rankingPending:true};
    }
  }
  async function finishWrites(game,previous) {
    const path = playerPath(game.player_hash);
    const playerDoc = await get(path);
    if (!playerDoc) fail('Jugador no encontrado. Reconectá para recuperar la partida.',503);
    const player = unpack(playerDoc);
    const writes = [documentWrite(gamePath(game.id),game,previous)];
    if (player.score < game.score || (player.score===game.score && player.elapsed_ms>game.elapsed_ms)) {
      Object.assign(player,{nickname:game.nickname,avatar:game.avatar,score:game.score,elapsed_ms:game.elapsed_ms,updated_at:game.finished_at});
      const rankPath = `${root}/quizRankings/${VERSION}/players/${player.public_id}`;
      const rankDoc = await get(rankPath);
      const entry = {id:player.public_id,nickname:player.nickname,avatar:player.avatar,score:player.score,elapsedMs:player.elapsed_ms,updatedAt:player.updated_at};
      entry.orderKey = `${String(125-entry.score).padStart(3,'0')}:${String(entry.elapsedMs).padStart(7,'0')}:${String(entry.updatedAt).padStart(13,'0')}:${entry.id}`;
      writes.push(documentWrite(path,player,playerDoc),documentWrite(rankPath,entry,rankDoc));
    }
    return writes;
  }
  return {
    leaderboard: () => ranking.leaderboard(),
    async start(body,now) {
      const nickname = cleanName(body.nickname);
      if (!Number.isInteger(body.avatar)||body.avatar<1||body.avatar>4) fail('Elegí un personaje.');
      const token = typeof body.playerToken==='string'&&uuidPattern.test(body.playerToken)?body.playerToken:crypto.randomUUID();
      const hash = await digest(token);
      const id = await deviceGameId(hash);
      return retry(async()=>{
        const existing = await get(gamePath(id));
        if (existing) {
          const game = unpack(existing);
          if (game.player_hash!==hash) fail('Partida no encontrada.',404);
          const state = await this.action('state',{gameToken:id},now);
          return {gameToken:id,playerToken:token,...state};
        }
        const [playerDoc,rateDoc] = await Promise.all([get(playerPath(hash)),get(`${root}/quizRateLimits/${await digest(hash+Math.floor(now/3600000))}`)]);
        const rate = rateDoc?unpack(rateDoc):{starts:0};
        if (rate.starts>=60) fail('Llegaste al límite de partidas por hora. Volvé más tarde.',429);
        const player = playerDoc?unpack(playerDoc):{token_hash:hash,public_id:crypto.randomUUID(),nickname,avatar:body.avatar,version:VERSION,score:-1,elapsed_ms:0,updated_at:now};
        const game = newGame(id,hash,nickname,body.avatar,now);
        const writes = [documentWrite(gamePath(id),game,null),documentWrite(`${root}/quizRateLimits/${await digest(hash+Math.floor(now/3600000))}`,{starts:rate.starts+1,expires_at:now+86400000},rateDoc)];
        if (!playerDoc) writes.push(documentWrite(playerPath(hash),player,null));
        await commit(writes);
        return {gameToken:id,playerToken:token,...publicGame(game,now)};
      });
    },
    async action(action,body,now) {
      if (typeof body.gameToken!=='string'||!uuidPattern.test(body.gameToken)) fail('Partida no encontrada.',404);
      return retry(async()=>{
        const previous = await get(gamePath(body.gameToken));
        if (!previous) fail('Partida no encontrada.',404);
        const game = unpack(previous);
        if(game.rules_version!==RULES_VERSION)fail('El quiz se actualizó. Volvé al inicio para entrar a la nueva edición.',409);
        if (game.phase==='done') return result(game);
        if (action==='next') {
          // Retrying a lost "next" response returns the same active question and deadline.
          if (game.phase==='active') return publicGame(game,now);
          if (game.phase!=='ready') fail('Primero respondé la pregunta actual.',409);
          Object.assign(game,{phase:'active',issued_at:now,deadline:now+TIME});
          await commit([documentWrite(gamePath(game.id),game,previous)]);
          return publicGame(game,now);
        }
        if (action==='state') {
          if (game.phase==='ready') return readyGame(game);
          if (!expired(game,now)) return publicGame(game,now);
          applyAnswer(game,{questionId:orderedQuestions[game.cursor].id,choice:null},now);
          await commit(game.phase==='done'?await finishWrites(game,previous):[documentWrite(gamePath(game.id),game,previous)]);
          return game.phase==='done'?result(game):readyGame(game);
        }
        if (action!=='answer') fail('Operación no encontrada.',404);
        if (game.phase==='ready') {
          if (orderedQuestions[game.cursor-1]?.id===body.questionId) return readyGame(game);
          fail('La pregunta cambió.',409);
        }
        if(!applyAnswer(game,body,now))return publicGame(game,now);
        const finished=game.phase==='done';
        await commit(finished?await finishWrites(game,previous):[documentWrite(gamePath(game.id),game,previous)]);
        return finished?result(game):readyGame(game);
      });
    }
  };
}
