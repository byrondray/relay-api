import { sqliteTable, text, int } from "drizzle-orm/sqlite-core";

export const schools = sqliteTable("school", {
  id: text("id").primaryKey().notNull(),
  districtNumber: int("district_number").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
});

export type School = typeof schools.$inferSelect;
export type SchoolInsert = typeof schools.$inferInsert;
