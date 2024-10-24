import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { users } from "./users";
import { vehicle } from "./vehicle";
import { sql } from "drizzle-orm";
import { groups } from "./groups";
export const carpools = sqliteTable("carpools", {
  id: text("id").primaryKey(),
  driverId: text("driver_id")
    .references(() => users.id)
    .notNull(),
  vehicleId: text("vehicle_id")
    .references(() => vehicle.id)
    .notNull(),
  groupId: text("group_id")
    .references(() => groups.id)
    .notNull(),
  startAddress: text("start_address").notNull(),
  endAddress: text("end_address").notNull(),
  startLat: real("start_lat").notNull(),
  startLon: real("start_lon").notNull(),
  endLat: real("end_lat").notNull(),
  endLon: real("end_lon").notNull(),
  departureDate: text("departure_date").notNull(),
  departureTime: text("departure_time").notNull(),
  extraCarSeat: integer("extra_car_seat").default(0),
  winterTires: integer("winter_tires").default(0),
  tripPreferences: text("trip_preferences"),
  estimatedTime: text("estimated_time").default(sql`NULL`),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});

export type Carpool = typeof carpools.$inferSelect;
export type CarpoolInsert = typeof carpools.$inferInsert;
