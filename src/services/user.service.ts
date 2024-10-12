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

export const findUserById = async (id: string) => {
  return await db.select().from(users).where(eq(users.id, id));
};

export const getUsers = async () => {
  return await db.select().from(users);
};

export const updateExpoPushToken = async (
  userId: string,
  expoPushToken: string
) => {
  try {
    const user = await findUserById(userId);
    if (!user.length) {
      throw new Error(`User with ID ${userId} not found.`);
    }
    const result = await db
      .update(users)
      .set({ expoPushToken: expoPushToken })
      .where(eq(users.id, userId))
      .returning();

    console.log(result, 'result');
    return result;
  } catch (error) {
    console.error(`Error finding user with ID ${userId}:`, error);
    throw error;
  }
};
