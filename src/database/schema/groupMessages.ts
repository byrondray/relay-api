import { text, sqliteTable } from "drizzle-orm/sqlite-core";
import { groups } from "./groups";
import { users } from "./users";

export const groupMessages = sqliteTable("groupMessages", {
  id: text("id").primaryKey().notNull(),
  groupId: text("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull(),
});
