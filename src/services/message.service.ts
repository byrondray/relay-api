import { and, eq } from "drizzle-orm";
import { getDB } from "../database/client";
import { messages } from "../database/schema/messages";
import { MessageInsert } from "../database/schema/messages";
import { users } from "../database/schema/users";

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

const senderUsers = { ...users };
const recipientUsers = { ...users };

export const getPrivateMessageConvo = async (
  senderId: string,
  recipientId: string
) => {
  const messagesResult = await db
    .select({
      messageId: messages.id,
      text: messages.text,
      createdAt: messages.createdAt,
      senderId: messages.senderId,
      recipientId: messages.recipientId,
      senderFirstName: senderUsers.firstName,
      senderLastName: senderUsers.lastName,
      senderEmail: senderUsers.email,
      senderImageUrl: senderUsers.imageUrl,
      recipientFirstName: recipientUsers.firstName,
      recipientLastName: recipientUsers.lastName,
      recipientEmail: recipientUsers.email,
      recipientImageUrl: recipientUsers.imageUrl,
    })
    .from(messages)
    .innerJoin(senderUsers, eq(messages.senderId, senderUsers.id))
    .innerJoin(recipientUsers, eq(messages.recipientId, recipientUsers.id))
    .where(
      and(
        eq(messages.senderId, senderId),
        eq(messages.recipientId, recipientId)
      )
    );

  return messagesResult.map((message) => ({
    id: message.messageId,
    text: message.text,
    createdAt: message.createdAt,
    sender: {
      id: message.senderId,
      firstName: message.senderFirstName,
      lastName: message.senderLastName,
      email: message.senderEmail,
      imageUrl: message.senderImageUrl,
    },
    recipient: {
      id: message.recipientId,
      firstName: message.recipientFirstName,
      lastName: message.recipientLastName,
      email: message.recipientEmail,
      imageUrl: message.recipientImageUrl,
    },
  }));
};
