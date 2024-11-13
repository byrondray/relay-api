import { gql } from "graphql-tag";

export const groupMessageTypeDefs = gql`
  type GroupMessage {
    id: ID!
    groupId: String!
    message: String!
    createdAt: String!
    sender: User!
  }

  type Query {
    getGroupMessages(groupId: String!): [GroupMessage!]!
  }

  type Mutation {
    createGroupMessage(groupId: String!, message: String!): GroupMessage!
  }

  type Subscription {
    groupMessageSent(groupId: String!): GroupMessage!
  }
`;
