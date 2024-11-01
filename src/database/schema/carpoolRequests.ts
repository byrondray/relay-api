// requests.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { carpools } from "./carpool";
import { users } from "./users";
import { groups } from "./groups";
import { sql } from "drizzle-orm";

export const requests = sqliteTable("requests", {
  id: text("id").primaryKey().notNull(),
  carpoolId: text("carpool_id").references(() => carpools.id),
  parentId: text("parent_id")
    .references(() => users.id)
    .notNull(),
  groupId: text("group_id")
    .references(() => groups.id)
    .notNull(),
  isApproved: integer("is_approved").default(0),
  startingAddress: text("starting_address").notNull(),
  endingAddress: text("ending_address").notNull(),
  startingLatitude: text("starting_latitude").notNull(),
  startingLongitude: text("starting_longitude").notNull(),
  endingLatitude: text("ending_latitude").notNull(),
  endingLongitude: text("ending_longitude").notNull(),
  pickupTime: text("pickup_time").notNull(),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});

export type Request = typeof requests.$inferSelect;
export type RequestInsert = typeof requests.$inferInsert;
