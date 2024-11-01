import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { schools } from "./schools";

export const children = sqliteTable("children", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  firstName: text("first_name").notNull(),
  schoolId: text("school_id")
    .references(() => schools.id)
    .notNull(),
  imageUrl: text("image_url"),
  schoolEmailAddress: text("school_email_address"),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});

export type Child = typeof children.$inferSelect;
export type ChildInsert = typeof children.$inferInsert;
