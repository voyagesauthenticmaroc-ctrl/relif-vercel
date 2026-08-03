CREATE TABLE IF NOT EXISTS `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`full_name` text,
	`expires_at` text NOT NULL,
	`revoked_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `auth_sessions_email_idx` ON `auth_sessions` (`email`,`created_at`);
