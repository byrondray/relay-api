import { ApolloError } from "apollo-server-errors";
import { getDB } from "../../database/client";
import { groupMessages } from "../../database/schema/groupMessages";
import { usersToGroups } from "../../database/schema/usersToGroups";
import { users } from "../../database/schema/users";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { FirebaseUser } from "./userResolvers";
import { PubSub } from "graphql-subscriptions";

const db = getDB();
const pubsub = new PubSub();

export const groupMessageResolvers = {
  Query: {
    getGroupMessages: async (
      _: any,
      { groupId }: { groupId: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const result = await db
        .select({
          messageId: groupMessages.id,
          groupId: groupMessages.groupId,
          userId: groupMessages.userId,
          message: groupMessages.message,
          createdAt: groupMessages.createdAt,
          senderId: users.id,
          senderFirstName: users.firstName,
          senderLastName: users.lastName,
          senderImageUrl: users.imageUrl,
        })
        .from(groupMessages)
        .innerJoin(users, eq(groupMessages.userId, users.id))
        .where(eq(groupMessages.groupId, groupId));

      return result.map((record) => ({
        id: record.messageId,
        groupId: record.groupId,
        userId: record.userId,
        message: record.message,
        createdAt: record.createdAt,
        sender: {
          id: record.senderId,
          firstName: record.senderFirstName,
          lastName: record.senderLastName,
          imageUrl: record.senderImageUrl,
        },
      }));
    },
  },

  Mutation: {
    createGroupMessage: async (
      _: any,
      { groupId, message }: { groupId: string; message: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const groupMessageData = {
        id: uuid(),
        groupId,
        userId: currentUser.uid,
        message,
        createdAt: new Date().toISOString(),
      };

      const result = await db.insert(groupMessages).values(groupMessageData);

      if (result) {
        const sender = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            imageUrl: users.imageUrl,
            email: users.email,
            city: users.city,
          })
          .from(users)
          .where(eq(users.id, currentUser.uid));

        const messageWithSender = {
          ...groupMessageData,
          sender,
        };

        const groupMembers = await db
          .select()
          .from(usersToGroups)
          .where(eq(usersToGroups.groupId, groupId));

        groupMembers.forEach((member) => {
          pubsub.publish(`GROUP_MESSAGE_SENT_${member.userId}`, {
            groupMessageSent: messageWithSender,
          });
        });

        return messageWithSender;
      } else {
        throw new ApolloError("Failed to create group message.");
      }
    },
  },

  Subscription: {
    groupMessageSent: {
      subscribe: async (_: any, { groupId }: { groupId: string }) => {
        const groupMembers = await db
          .select()
          .from(usersToGroups)
          .where(eq(usersToGroups.groupId, groupId));

        const asyncIterators = groupMembers.map((member) =>
          pubsub.asyncIterator(`GROUP_MESSAGE_SENT_${member.userId}`)
        );

        return asyncIterators;
      },
      resolve: (payload: { groupMessageSent: any }) => {
        if (!payload.groupMessageSent) {
          throw new Error("No group message was sent.");
        }
        return payload.groupMessageSent;
      },
    },
  },
};
