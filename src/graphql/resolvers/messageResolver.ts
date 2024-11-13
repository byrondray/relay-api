import {
  createMessage,
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
import { FirebaseUser } from "./userResolvers";

const pubsub = new PubSub();

export const messageResolvers = {
  Query: {
    getPrivateMessageConversation: async (
      _: any,
      { senderId, recipientId }: { senderId: string; recipientId: string },
      { currentUser }: FirebaseUser
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
      { currentUser }: FirebaseUser
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
        const newMessage = {
          senderId,
          recipientId,
          text,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        const [createdMessage] = await createMessage(newMessage);

        const sender = await findUserById(senderId);
        const recipient = await findUserById(recipientId);

        if (!sender || !recipient) {
          throw new ApolloError("Sender or recipient not found");
        }

        const detailedMessage = {
          id: createdMessage.id,
          text: createdMessage.text,
          createdAt: createdMessage.createdAt,
          sender: {
            id: sender[0].id,
            firstName: sender[0].firstName,
            lastName: sender[0].lastName,
            email: sender[0].email,
            imageUrl: sender[0].imageUrl,
          },
          recipient: {
            id: recipient[0].id,
            firstName: recipient[0].firstName,
            lastName: recipient[0].lastName,
            email: recipient[0].email,
            imageUrl: recipient[0].imageUrl,
          },
        };

        pubsub.publish(`MESSAGE_SENT_${recipientId}`, {
          messageSent: detailedMessage,
        });

        if (recipient[0].expoPushToken) {
          await sendPushNotification(
            recipient[0].expoPushToken,
            text,
            senderId,
            `New Message from ${sender[0].firstName}`
          );
        } else {
          console.log("No Expo Push Token found for recipient:", recipientId);
        }

        return detailedMessage;
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
