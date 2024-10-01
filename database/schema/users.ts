// docs: https://orm.drizzle.team/docs/sql-schema-declaration
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").notNull(),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});
