import { getDB } from "@/database/client";
import { users } from "./schema/users";
import { messages } from "./schema/messages";

const db = getDB();

(await db.select().from(users)).length > 0 && (await db.delete(users));
(await db.select().from(messages)).length > 0 && (await db.delete(messages));
