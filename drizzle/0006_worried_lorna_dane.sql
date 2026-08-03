CREATE TABLE IF NOT EXISTS `workspace_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'analyst' NOT NULL,
	`token_hash` text NOT NULL,
	`invited_by` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` text NOT NULL,
	`accepted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `workspace_invitations_token_idx` ON `workspace_invitations` (`token_hash`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `workspace_invitations_workspace_idx` ON `workspace_invitations` (`workspace_id`,`status`);
