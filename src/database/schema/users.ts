// docs: https://orm.drizzle.team/docs/sql-schema-declaration
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").notNull(),
  phoneNumber: text("phone_number"),
  city: text("city"),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
  insuranceImageUrl: text("insurance_image_url"),
  licenseImageUrl: text("license_image_url"),
  expoPushToken: text("expo_push_token"),
});

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
