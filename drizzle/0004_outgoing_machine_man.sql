CREATE TABLE IF NOT EXISTS `auth_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`window_started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_request_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `email_verification_links` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`full_name` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `email_verification_links_token_idx` ON `email_verification_links` (`token_hash`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `email_verification_links_email_idx` ON `email_verification_links` (`email`,`created_at`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workspace_onboarding` (
	`email` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`company_name` text NOT NULL,
	`domain` text NOT NULL,
	`country` text NOT NULL,
	`sector` text NOT NULL,
	`objective` text NOT NULL,
	`competitors_json` text DEFAULT '[]' NOT NULL,
	`questions_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
