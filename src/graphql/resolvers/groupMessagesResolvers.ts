import { ApolloError } from "apollo-server-errors";
import { getDB } from "../../database/client";
import { groupMessages } from "../../database/schema/groupMessages";
import { usersToGroups } from "../../database/schema/usersToGroups";
import { users } from "../../database/schema/users";
import { and, eq, ne } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { FirebaseUser } from "./userResolvers";
import { PubSub } from "graphql-subscriptions";
import { sendPushNotification } from "../../utils/pushNotification";
import { groups } from "../../database/schema/groups";

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
          })
          .from(users)
          .where(eq(users.id, currentUser.uid));

        const messageWithSender = {
          ...groupMessageData,
          sender: sender[0],
        };

        pubsub.publish(`GROUP_MESSAGE_SENT_${groupId}`, {
          groupMessageSent: messageWithSender,
        });

        const groupMembers = await db
          .select({
            id: users.id,
            expoPushToken: users.expoPushToken,
          })
          .from(users)
          .innerJoin(usersToGroups, eq(users.id, usersToGroups.userId))
          .where(
            and(
              eq(usersToGroups.groupId, groupId),
              ne(users.id, currentUser.uid)
            )
          );

        const group = await db
          .select()
          .from(groups)
          .where(eq(groups.id, groupId));

        for (const member of groupMembers) {
          if (member.expoPushToken) {
            await sendPushNotification(
              member.expoPushToken,
              message,
              currentUser.uid,
              `${sender[0].firstName} sent a message in ${group[0].name}`
            );
          }
        }

        return messageWithSender;
      } else {
        throw new ApolloError("Failed to create group message.");
      }
    },
  },

  Subscription: {
    groupMessageSent: {
      subscribe: async (_: any, { groupId }: { groupId: string }) => {
        console.log("Subscribing to group messages for group:", groupId);

        return pubsub.asyncIterator(`GROUP_MESSAGE_SENT_${groupId}`);
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
