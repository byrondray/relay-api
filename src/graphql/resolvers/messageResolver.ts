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
import { FirebaseUser } from "./userResolvers";

const pubsub = new PubSub();

export const messageResolvers = {
  Query: {
    getConversationsForUser: async (
      _: any,
      { userId }: { userId: string },
      { currentUser }: FirebaseUser
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

        return {
          recipientName: `${sortedMessages[0].recipient.firstName} ${sortedMessages[0].recipient.lastName}`,
          messages: sortedMessages,
        };
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
        // Create the message entry
        const newMessage = {
          senderId,
          recipientId,
          text,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        const [createdMessage] = await createMessage(newMessage); // Assuming `createMessage` returns a list

        // Retrieve sender and recipient details for DetailedMessage
        const sender = await findUserById(senderId);
        const recipient = await findUserById(recipientId);

        if (!sender || !recipient) {
          throw new ApolloError("Sender or recipient not found");
        }

        // Construct the DetailedMessage object to match the expected client response
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

        // Publish the message to the subscription
        pubsub.publish(`MESSAGE_SENT_${recipientId}`, {
          messageSent: detailedMessage,
        });

        // Check for Expo push token and send notification
        if (recipient[0].expoPushToken) {
          await sendPushNotification(
            recipient[0].expoPushToken,
            text,
            senderId
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
