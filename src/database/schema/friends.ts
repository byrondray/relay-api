import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";
import { sql } from "drizzle-orm";

export const friends = sqliteTable("friends", {
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  friendId: text("friend_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});
