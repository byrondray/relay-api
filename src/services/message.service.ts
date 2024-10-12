import { and, eq } from 'drizzle-orm';
import { getDB } from '../database/client';
import { messages } from '../database/schema/messages';
import { MessageInsert } from '../database/schema/messages';
import { users } from '../database/schema/users';

let db = getDB();

export const createMessage = async (message: MessageInsert) => {
  return await db.insert(messages).values(message).returning();
};

export const getConvosForUser = async (userId: string) => {
  return await db
    .select({ recipientName: users.firstName, messages: messages.text })
    .from(messages)
    .where(eq(messages.senderId, userId))
    .innerJoin(users, eq(users.id, messages.recipientId));
};

export const getPrivateMessageConvo = async (
  senderId: string,
  recipientId: string
) => {
  return await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.senderId, senderId),
        eq(messages.recipientId, recipientId)
      )
    );
};
