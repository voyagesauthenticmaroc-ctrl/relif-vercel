CREATE TABLE `usage_events` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`metric` text DEFAULT 'ai_measure' NOT NULL,
	`period_start` text NOT NULL,
	`amount` integer NOT NULL,
	`used_before` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `usage_events_workspace_created_idx` ON `usage_events` (`workspace_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `billing_checkout_sessions` ADD `reservation_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `billing_checkout_reservation_idx` ON `billing_checkout_sessions` (`reservation_key`);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `billing_cycle` text DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE `usage_counters` ADD `source_event_order` integer DEFAULT 0 NOT NULL;