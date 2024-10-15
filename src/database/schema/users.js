"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = void 0;
// docs: https://orm.drizzle.team/docs/sql-schema-declaration
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.users = (0, sqlite_core_1.sqliteTable)('users', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    firstName: (0, sqlite_core_1.text)('first_name').notNull(),
    lastName: (0, sqlite_core_1.text)('last_name'),
    email: (0, sqlite_core_1.text)('email').notNull(),
    createdAt: (0, sqlite_core_1.text)('created_at').default((0, drizzle_orm_1.sql) `(current_timestamp)`),
    expoPushToken: (0, sqlite_core_1.text)('expo_push_token'),
});
