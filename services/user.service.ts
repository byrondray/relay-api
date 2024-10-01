import { getDB } from '../database/client';
import { UserInsert } from '../database/schema/users';
import { users } from '../database/schema/users';

const db = getDB();

export const createUser = async (user: UserInsert) => {
  return db.insert(users).values(user).returning();
};
