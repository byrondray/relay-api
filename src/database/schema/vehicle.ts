import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users } from "../schema/users";

export const vehicle = sqliteTable("vehicle", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: text("year").notNull(),
  licensePlate: text("license_plate").notNull(),
  numberOfSeats: integer("number_of_seats").notNull(),
  vehicleImageUrl: text("vehicle_image_url"),
  color: text("color").notNull(),
});

export type User = typeof vehicle.$inferSelect;
export type UserInsert = typeof vehicle.$inferInsert;
