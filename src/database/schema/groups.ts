import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const groups = sqliteTable("groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  temporary: text("temporary").notNull(),
});

export type Group = typeof groups.$inferSelect;
export type GroupInsert = typeof groups.$inferInsert;