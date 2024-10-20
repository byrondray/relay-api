import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const children = sqliteTable("children", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  birthdate: text("birthdate"),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});

export type Child = typeof children.$inferSelect;
export type ChildInsert = typeof children.$inferInsert;
