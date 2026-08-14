CREATE TABLE `invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`inviter_id` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviter_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `invitation_organization_id_idx` ON `invitation` (`organization_id`);--> statement-breakpoint
CREATE INDEX `invitation_email_idx` ON `invitation` (`email`);--> statement-breakpoint
CREATE TABLE `member` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_organization_user_unique` ON `member` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `member_organization_id_idx` ON `member` (`organization_id`);--> statement-breakpoint
CREATE INDEX `member_user_id_idx` ON `member` (`user_id`);--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo` text,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);--> statement-breakpoint
INSERT INTO `organization` (`id`, `name`, `slug`, `created_at`)
SELECT `id`, `name`, 'team-' || `id`, `created_at`
FROM `team`;--> statement-breakpoint
INSERT INTO `member` (`id`, `organization_id`, `user_id`, `role`, `created_at`)
SELECT
	lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
	`team_member`.`team_id`,
	`team_member`.`user_id`,
	CASE
		WHEN `team_member`.`user_id` = COALESCE(
			(SELECT `created_by_user_id` FROM `team` WHERE `team`.`id` = `team_member`.`team_id` AND EXISTS (
				SELECT 1 FROM `team_member` AS `creator_membership`
				INNER JOIN `user` AS `creator_user` ON `creator_user`.`id` = `creator_membership`.`user_id`
				WHERE `creator_membership`.`team_id` = `team`.`id`
				AND `creator_membership`.`user_id` = `team`.`created_by_user_id`
			)),
			(SELECT `fallback_member`.`user_id` FROM `team_member` AS `fallback_member`
			 INNER JOIN `user` AS `fallback_user` ON `fallback_user`.`id` = `fallback_member`.`user_id`
			 WHERE `fallback_member`.`team_id` = `team_member`.`team_id`
			 ORDER BY `fallback_member`.`joined_at`, `fallback_member`.`user_id` LIMIT 1)
		) THEN 'owner'
		ELSE 'member'
	END,
	`team_member`.`joined_at`
FROM `team_member`
INNER JOIN `user` ON `user`.`id` = `team_member`.`user_id`;--> statement-breakpoint
ALTER TABLE `session` ADD `active_organization_id` text;
