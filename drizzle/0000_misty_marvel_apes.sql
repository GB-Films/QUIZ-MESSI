CREATE TABLE `quiz_games` (
	`id` text PRIMARY KEY NOT NULL,
	`player_hash` text NOT NULL,
	`nickname` text NOT NULL,
	`avatar` integer NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`cursor` integer DEFAULT 0 NOT NULL,
	`phase` text NOT NULL,
	`issued_at` integer NOT NULL,
	`deadline` integer NOT NULL,
	`elapsed_ms` integer DEFAULT 0 NOT NULL,
	`reason` text,
	`version` text NOT NULL,
	`ip_bucket` text NOT NULL,
	`created_at` integer NOT NULL,
	`finished_at` integer
);
--> statement-breakpoint
CREATE INDEX `quiz_games_rate` ON `quiz_games` (`ip_bucket`,`created_at`);--> statement-breakpoint
CREATE TABLE `quiz_players` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`nickname` text NOT NULL,
	`avatar` integer NOT NULL,
	`score` integer DEFAULT -1 NOT NULL,
	`elapsed_ms` integer DEFAULT 0 NOT NULL,
	`version` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quiz_players_public_id` ON `quiz_players` (`public_id`);--> statement-breakpoint
CREATE INDEX `quiz_players_ranking` ON `quiz_players` (`version`,`score`,`elapsed_ms`);