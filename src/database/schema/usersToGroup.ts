import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "../schema/users";
import { groups } from "./groups";

export const usersToGroups = sqliteTable("usersToGroups", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  groupId: text("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
});
