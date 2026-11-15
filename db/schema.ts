import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const waitlist = sqliteTable('launch_waitlist', {
 id: text('id').primaryKey(),
 email: text('email').notNull(),
 joinedAt: text('joined_at').notNull(),
 consentVersion: text('consent_version').notNull(),
 unsubscribeToken: text('unsubscribe_token').notNull(),
}, table => [uniqueIndex('waitlist_email_unique').on(table.email), uniqueIndex('waitlist_token_unique').on(table.unsubscribeToken)]);
