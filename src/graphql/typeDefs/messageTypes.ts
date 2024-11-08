import { gql } from "graphql-tag";

export const messageTypeDefs = gql`
  type Message {
    id: ID!
    senderId: String!
    recipientId: String!
    text: String!
    createdAt: String!
  }

  type DetailedMessage {
    id: ID!
    sender: User!
    recipient: User!
    text: String!
    createdAt: String!
  }

  type Conversation {
    recipientName: String!
    messages: [DetailedMessage!]!
  }

  type Query {
    getConversationsForUser(userId: String!): [Conversation!]!
    getPrivateMessageConversation(
      senderId: String!
      recipientId: String!
    ): [DetailedMessage!]!
  }

  type Mutation {
    createMessage(
      senderId: String!
      recipientId: String!
      text: String!
    ): DetailedMessage!
  }

  type Subscription {
    messageSent(recipientId: String!): DetailedMessage!
  }
`;
