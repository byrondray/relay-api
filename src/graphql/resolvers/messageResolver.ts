import {
  createMessage,
  getConvosForUser,
  getPrivateMessageConvo,
} from "../../services/message.service";
import {
  ApolloError,
  AuthenticationError,
  UserInputError,
} from "apollo-server-errors";
import { v4 as uuidv4 } from "uuid";
import { findUserById } from "../../services/user.service";
import { PubSub } from "graphql-subscriptions";
import { Message } from "graphql-ws";
import { sendPushNotification } from "../../utils/pushNotification";

const pubsub = new PubSub();

export const messageResolvers = {
  Query: {
    getConversationsForUser: async (
      _: any,
      { userId }: { userId: string },
      { currentUser }: any
    ) => {
      if (!currentUser) {
        throw new AuthenticationError("Authentication required");
      }

      try {
        const conversations = await getConvosForUser(userId);
        return conversations;
      } catch (error) {
        console.error(
          `Error fetching conversations for user ${userId}:`,
          error
        );
        throw new ApolloError("Failed to fetch conversations.");
      }
    },

    getPrivateMessageConversation: async (
      _: any,
      { senderId, recipientId }: { senderId: string; recipientId: string },
      { currentUser }: any
    ) => {
      if (!currentUser) {
        throw new AuthenticationError("Authentication required");
      }

      try {
        const messages = await getPrivateMessageConvo(senderId, recipientId);

        const sortedMessages = messages.sort(
          (a, b) =>
            new Date(a.createdAt ?? "").getTime() -
            new Date(b.createdAt ?? "").getTime()
        );

        return sortedMessages;
      } catch (error) {
        console.error(
          `Error fetching conversation between ${senderId} and ${recipientId}:`,
          error
        );
        throw new ApolloError("Failed to fetch private conversation.");
      }
    },
  },

  Mutation: {
    createMessage: async (
      _: any,
      {
        senderId,
        recipientId,
        text,
      }: { senderId: string; recipientId: string; text: string },
      { currentUser }: any
    ) => {
      if (!currentUser) {
        throw new AuthenticationError("Authentication required");
      }

      if (!senderId || !recipientId || !text) {
        throw new UserInputError(
          "Sender ID, Recipient ID, and Text must be provided"
        );
      }

      try {
        const newMessage = { senderId, recipientId, text, id: uuidv4() };
        const [createdMessage] = await createMessage(newMessage);

        pubsub.publish(`MESSAGE_SENT_${recipientId}`, {
          messageSent: createdMessage,
        });

        const recipient = await findUserById(recipientId);
        if (recipient.length > 0 && recipient[0].expoPushToken) {
          const expoPushToken = recipient[0].expoPushToken;
          await sendPushNotification(expoPushToken, text, senderId);
        } else {
          console.log("No Expo Push Token found for recipient:", recipientId);
        }

        return createdMessage;
      } catch (error) {
        console.error("Error creating message:", error);
        throw new ApolloError("Failed to create message.");
      }
    },
  },

  Subscription: {
    messageSent: {
      subscribe: async (_: any, { recipientId }: { recipientId: string }) => {
        const asyncIterator = pubsub.asyncIterator(
          `MESSAGE_SENT_${recipientId}`
        );

        return asyncIterator;
      },
      resolve: (payload: { messageSent: Message }) => {
        if (!payload.messageSent) {
          throw new Error("No message was sent.");
        }

        return payload.messageSent;
      },
    },
  },
};
