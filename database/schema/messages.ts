// docs: https://orm.drizzle.team/docs/sql-schema-declaration
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  senderId: text("sender_id")
    .references(() => users.id)
    .notNull(),
  recipientId: text("recipient_id")
    .references(() => users.id)
    .notNull(),
  text: text("text").notNull(),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});
