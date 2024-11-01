import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { children } from "./children";
import { requests } from "./carpoolRequests";

export const childToRequest = sqliteTable("childToRequest", {
  id: text("id").primaryKey().notNull(),
  childId: text("child_id")
    .references(() => children.id)
    .notNull(),
  requestId: text("request_id")
    .references(() => requests.id)
    .notNull(),
});

export type ChildToRequest = typeof childToRequest.$inferSelect;
export type ChildToRequestInsert = typeof childToRequest.$inferInsert;
