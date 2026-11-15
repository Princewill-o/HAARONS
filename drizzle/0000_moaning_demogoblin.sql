CREATE TABLE `launch_waitlist` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`joined_at` text NOT NULL,
	`consent_version` text NOT NULL,
	`unsubscribe_token` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_email_unique` ON `launch_waitlist` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_token_unique` ON `launch_waitlist` (`unsubscribe_token`);