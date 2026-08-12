CREATE TABLE `game_session` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`created_by_user_id` text,
	`invite_token_hash` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`started_at` integer,
	`ended_at` integer,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "game_session_status_check" CHECK("game_session"."status" in ('created', 'active', 'ended'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_session_invite_token_hash_unique` ON `game_session` (`invite_token_hash`);--> statement-breakpoint
CREATE INDEX `game_session_team_status_idx` ON `game_session` (`team_id`,`status`);--> statement-breakpoint
CREATE INDEX `game_session_created_by_user_id_idx` ON `game_session` (`created_by_user_id`);--> statement-breakpoint
ALTER TABLE `bingo_card` ADD `session_id` text REFERENCES game_session(id);--> statement-breakpoint
CREATE INDEX `bingo_card_session_user_idx` ON `bingo_card` (`session_id`,`user_id`);