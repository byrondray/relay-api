import { gql } from 'graphql-tag';

export const messageTypeDefs = gql`
  type Message {
    id: ID!
    senderId: String!
    recipientId: String!
    text: String!
    createdAt: String!
  }

  type Conversation {
    recipientName: String!
    messages: String!
  }

  type Query {
    getConversationsForUser(userId: String!): [Conversation!]!
    getPrivateMessageConversation(
      senderId: String!
      recipientId: String!
    ): [Message!]!
  }

  type Mutation {
    createMessage(
      senderId: String!
      recipientId: String!
      text: String!
    ): Message!
  }

  type Mutation {
    testNotification(
      recipientId: String!
      messageText: String!
    ): TestNotificationResponse
  }

  type TestNotificationResponse {
    success: Boolean!
    message: String!
  }

  # Subscription type for listening to new messages
  type Subscription {
    messageSent(recipientId: String!): Message!
  }
`;
