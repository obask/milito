CREATE TABLE `game_players` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`user_id` text NOT NULL,
	`position` integer NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`joined_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `game_rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `game_players_roomId_idx` ON `game_players` (`room_id`);--> statement-breakpoint
CREATE INDEX `game_players_userId_idx` ON `game_players` (`user_id`);--> statement-breakpoint
CREATE TABLE `game_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`name` text NOT NULL,
	`host_id` text NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`max_players` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`host_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `game_rooms_gameId_idx` ON `game_rooms` (`game_id`);--> statement-breakpoint
CREATE INDEX `game_rooms_hostId_idx` ON `game_rooms` (`host_id`);--> statement-breakpoint
CREATE INDEX `game_rooms_status_idx` ON `game_rooms` (`status`);--> statement-breakpoint
CREATE TABLE `game_state` (
	`room_id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`current_turn` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `game_rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`min_players` integer NOT NULL,
	`max_players` integer NOT NULL,
	`image_url` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
