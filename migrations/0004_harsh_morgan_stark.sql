CREATE TABLE `game_session_result` (
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`completed_at` integer,
	PRIMARY KEY(`session_id`, `user_id`),
	FOREIGN KEY (`session_id`) REFERENCES `game_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `game_session_result_user_id_idx` ON `game_session_result` (`user_id`);--> statement-breakpoint
INSERT INTO `game_session_result` (`session_id`, `user_id`, `completed_at`)
SELECT `session_id`, `user_id`, `completed_at`
FROM `bingo_card`
WHERE `session_id` IS NOT NULL
ON CONFLICT (`session_id`, `user_id`) DO UPDATE SET `completed_at` = excluded.`completed_at`;--> statement-breakpoint
DELETE FROM `bingo_card_cell`
WHERE `card_id` IN (SELECT `id` FROM `bingo_card` WHERE `session_id` IS NOT NULL);--> statement-breakpoint
DELETE FROM `bingo_card` WHERE `session_id` IS NOT NULL;--> statement-breakpoint
DROP INDEX `bingo_card_session_user_idx`;--> statement-breakpoint
ALTER TABLE `bingo_card` DROP COLUMN `session_id`;
