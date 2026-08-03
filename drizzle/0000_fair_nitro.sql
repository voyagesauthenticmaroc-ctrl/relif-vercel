CREATE TABLE `memberships` (
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`workspace_id`, `user_id`),
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stripe_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`object_id` text,
	`event_created` integer NOT NULL,
	`processed_at` text,
	`error` text
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`stripe_subscription_id` text,
	`stripe_price_id` text,
	`plan_code` text NOT NULL,
	`status` text NOT NULL,
	`trial_end` text,
	`current_period_start` text,
	`current_period_end` text,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_workspace_idx` ON `subscriptions` (`workspace_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_stripe_id_idx` ON `subscriptions` (`stripe_subscription_id`);--> statement-breakpoint
CREATE TABLE `trial_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`full_name` text NOT NULL,
	`company_name` text NOT NULL,
	`profile` text NOT NULL,
	`plan_code` text DEFAULT 'consultant' NOT NULL,
	`expected_monthly_measures` integer DEFAULT 300 NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`trial_starts_at` text,
	`trial_ends_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trial_requests_email_idx` ON `trial_requests` (`email`);--> statement-breakpoint
CREATE TABLE `usage_counters` (
	`workspace_id` text NOT NULL,
	`metric` text DEFAULT 'ai_measure' NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`limit` integer NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`workspace_id`, `metric`, `period_start`),
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'solo' NOT NULL,
	`stripe_customer_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_stripe_customer_idx` ON `workspaces` (`stripe_customer_id`);