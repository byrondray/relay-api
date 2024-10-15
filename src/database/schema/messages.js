"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messages = void 0;
// docs: https://orm.drizzle.team/docs/sql-schema-declaration
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_orm_1 = require("drizzle-orm");
const users_1 = require("./users");
exports.messages = (0, sqlite_core_1.sqliteTable)('messages', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    senderId: (0, sqlite_core_1.text)('sender_id')
        .references(() => users_1.users.id)
        .notNull(),
    recipientId: (0, sqlite_core_1.text)('recipient_id')
        .references(() => users_1.users.id)
        .notNull(),
    text: (0, sqlite_core_1.text)('text').notNull(),
    createdAt: (0, sqlite_core_1.text)('created_at').default((0, drizzle_orm_1.sql) `(current_timestamp)`),
});
