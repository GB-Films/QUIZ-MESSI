import { integer, text, sqliteTable, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const players = sqliteTable('quiz_players', {
  tokenHash: text('token_hash').primaryKey(),
  publicId: text('public_id').notNull(),
  nickname: text('nickname').notNull(),
  avatar: integer('avatar').notNull(),
  score: integer('score').notNull().default(-1),
  elapsedMs: integer('elapsed_ms').notNull().default(0),
  version: text('version').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, table => [
  uniqueIndex('quiz_players_public_id').on(table.publicId),
  index('quiz_players_ranking').on(table.version, table.score, table.elapsedMs),
]);

export const games = sqliteTable('quiz_games', {
  id: text('id').primaryKey(),
  playerHash: text('player_hash').notNull(),
  nickname: text('nickname').notNull(),
  avatar: integer('avatar').notNull(),
  score: integer('score').notNull().default(0),
  cursor: integer('cursor').notNull().default(0),
  phase: text('phase').notNull(),
  issuedAt: integer('issued_at').notNull(),
  deadline: integer('deadline').notNull(),
  elapsedMs: integer('elapsed_ms').notNull().default(0),
  reason: text('reason'),
  version: text('version').notNull(),
  ipBucket: text('ip_bucket').notNull(),
  createdAt: integer('created_at').notNull(),
  finishedAt: integer('finished_at'),
}, table => [index('quiz_games_rate').on(table.ipBucket, table.createdAt)]);
