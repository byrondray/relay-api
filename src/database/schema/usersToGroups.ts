import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";
import { groups } from "./groups";

export const usersToGroups = sqliteTable("users_to_groups", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  groupId: text("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
});
