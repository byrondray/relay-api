import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { carpools } from "./carpool";
import { users } from "./users";
import { children } from "./children";
import { sql } from "drizzle-orm";

export const requests = sqliteTable("requests", {
  id: text("id").primaryKey(),
  carpoolId: text("carpool_id")
    .references(() => carpools.id)
    .notNull(),
  parentId: text("parent_id")
    .references(() => users.id)
    .notNull(),
  childId: text("child_id")
    .references(() => children.id)
    .notNull(),
  isApproved: integer("is_approved").default(0),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});

export type Request = typeof requests.$inferSelect;
export type RequestInsert = typeof requests.$inferInsert;
