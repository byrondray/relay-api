import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";

export const communityCenters = sqliteTable("communityCenter", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
});

export type CommunityCenter = typeof communityCenters.$inferSelect;
export type CommunityCenterInsert = typeof communityCenters.$inferInsert;
