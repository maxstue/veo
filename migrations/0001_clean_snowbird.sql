CREATE TABLE `team_bingo_rules_preset` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`name` text NOT NULL,
	`board_size` integer NOT NULL,
	`win_horizontal` integer NOT NULL,
	`win_vertical` integer NOT NULL,
	`win_diagonal` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_bingo_rules_preset_team_name_unique` ON `team_bingo_rules_preset` (`team_id`,`name`);--> statement-breakpoint
CREATE INDEX `team_bingo_rules_preset_team_id_idx` ON `team_bingo_rules_preset` (`team_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_bingo_card_cell` (
	`card_id` text NOT NULL,
	`position` integer NOT NULL,
	`source_term_id` text,
	`label_snapshot` text NOT NULL,
	`marked_at` integer,
	PRIMARY KEY(`card_id`, `position`),
	FOREIGN KEY (`card_id`) REFERENCES `bingo_card`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_term_id`) REFERENCES `bingo_term`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "bingo_card_cell_position_check" CHECK("__new_bingo_card_cell"."position" >= 0 AND "__new_bingo_card_cell"."position" < 64)
);
--> statement-breakpoint
INSERT INTO `__new_bingo_card_cell`("card_id", "position", "source_term_id", "label_snapshot", "marked_at") SELECT "card_id", "position", "source_term_id", "label_snapshot", "marked_at" FROM `bingo_card_cell`;--> statement-breakpoint
DROP TABLE `bingo_card_cell`;--> statement-breakpoint
ALTER TABLE `__new_bingo_card_cell` RENAME TO `bingo_card_cell`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `bingo_card_cell_source_term_unique` ON `bingo_card_cell` (`card_id`,`source_term_id`);--> statement-breakpoint
ALTER TABLE `bingo_card` ADD `board_size` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `bingo_card` ADD `win_horizontal` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `bingo_card` ADD `win_vertical` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `bingo_card` ADD `win_diagonal` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `team` ADD `bingo_board_size` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `team` ADD `bingo_win_horizontal` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `team` ADD `bingo_win_vertical` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `team` ADD `bingo_win_diagonal` integer DEFAULT true NOT NULL;