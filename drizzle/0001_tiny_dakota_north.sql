CREATE TABLE `trial_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`window_started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `stripe_events` ADD `processing_started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `stripe_events` ADD `attempts` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `last_event_created` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `trial_requests` ADD `billing_event_created` integer DEFAULT 0 NOT NULL;