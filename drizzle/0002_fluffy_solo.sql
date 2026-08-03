CREATE TABLE `billing_checkout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`plan_code` text NOT NULL,
	`billing_cycle` text NOT NULL,
	`stripe_session_id` text,
	`checkout_url` text,
	`status` text DEFAULT 'creating' NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `billing_checkout_email_status_idx` ON `billing_checkout_sessions` (`email`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `billing_checkout_stripe_session_idx` ON `billing_checkout_sessions` (`stripe_session_id`);