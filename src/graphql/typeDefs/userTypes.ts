import { gql } from "graphql-tag";

export const userTypeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    expoPushToken: String!
  }

  type AuthPayload {
    id: ID!
    name: String!
    email: String!
    sessionId: String!
  }

  type Query {
    getUser(id: ID!): User
    getUsers: [User!]!
  }

  type Mutation {
    createUser(
      name: String!
      email: String!
      firebaseId: String!
      expoPushToken: String!
    ): AuthPayload!

    login(
      email: String!
      firebaseId: String!
      expoPushToken: String!
    ): AuthPayload!

    updateExpoPushToken(userId: String!, expoPushToken: String!): User!
  }
`;
