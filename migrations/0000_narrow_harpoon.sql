CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_provider_account_unique` ON `account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `bingo_card` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bingo_card_team_user_idx` ON `bingo_card` (`team_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `bingo_card_created_at_idx` ON `bingo_card` (`created_at`);--> statement-breakpoint
CREATE TABLE `bingo_card_cell` (
	`card_id` text NOT NULL,
	`position` integer NOT NULL,
	`source_term_id` text,
	`label_snapshot` text NOT NULL,
	`marked_at` integer,
	PRIMARY KEY(`card_id`, `position`),
	FOREIGN KEY (`card_id`) REFERENCES `bingo_card`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_term_id`) REFERENCES `bingo_term`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "bingo_card_cell_position_check" CHECK("bingo_card_cell"."position" >= 0 AND "bingo_card_cell"."position" < 25)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bingo_card_cell_source_term_unique` ON `bingo_card_cell` (`card_id`,`source_term_id`);--> statement-breakpoint
CREATE TABLE `bingo_term` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`label` text NOT NULL,
	`normalized_label` text NOT NULL,
	`created_by_user_id` text,
	`updated_by_user_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`updated_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bingo_term_team_normalized_label_unique` ON `bingo_term` (`team_id`,`normalized_label`);--> statement-breakpoint
CREATE INDEX `bingo_term_team_id_idx` ON `bingo_term` (`team_id`);--> statement-breakpoint
CREATE TABLE `team` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_by_user_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `team_created_by_user_id_idx` ON `team` (`created_by_user_id`);--> statement-breakpoint
CREATE TABLE `team_invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`invited_by_user_id` text,
	`expires_at` integer NOT NULL,
	`redeemed_at` integer,
	`redeemed_by_user_id` text,
	`revoked_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`redeemed_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_invitation_token_hash_unique` ON `team_invitation` (`token_hash`);--> statement-breakpoint
CREATE INDEX `team_invitation_team_id_idx` ON `team_invitation` (`team_id`);--> statement-breakpoint
CREATE INDEX `team_invitation_expires_at_idx` ON `team_invitation` (`expires_at`);--> statement-breakpoint
CREATE TABLE `team_member` (
	`team_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`team_id`, `user_id`),
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_member_user_id_idx` ON `team_member` (`user_id`);