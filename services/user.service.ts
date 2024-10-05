import { eq } from 'drizzle-orm';
import { getDB } from '../database/client';
import { UserInsert } from '../database/schema/users';
import { users } from '../database/schema/users';

const db = getDB();

export const createUser = async (user: UserInsert) => {
  return await db.insert(users).values(user).returning();
};

export const findUserByEmail = async (email: string) => {
  return await db.select().from(users).where(eq(users.email, email));
};
