import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { schools } from "./schools";
import { communityCenters } from "./communityCenters";

export const groups = sqliteTable("groups", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  schoolId: text("school_id").references(() => schools.id),
  communityCenterId: text("community_center_id").references(
    () => communityCenters.id
  ),
  imageUrl: text("image_url"),
});

export type Group = typeof groups.$inferSelect;
export type GroupInsert = typeof groups.$inferInsert;
