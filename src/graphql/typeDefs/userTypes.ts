import { gql } from "graphql-tag";

export const userTypeDefs = gql`
  type User {
    id: ID!
    firstName: String!
    lastName: String
    email: String!
    phoneNumber: String
    licenseImageUrl: String
    insuranceImageUrl: String
    city: String
    createdAt: String
    expoPushToken: String
  }

  type AuthPayload {
    id: ID!
    firstName: String!
    lastName: String
    email: String!
    sessionId: String!
  }

  type Query {
    getUser(id: ID!): User
    getUsers: [User!]!
    hasUserOnBoarded: Boolean!
  }

  type Mutation {
    createUser(
      firstName: String!
      lastName: String
      email: String!
      firebaseId: String!
      expoPushToken: String
    ): AuthPayload!

    login(
      email: String!
      firebaseId: String!
      expoPushToken: String
    ): AuthPayload!

    updateExpoPushToken(userId: String!, expoPushToken: String!): User!

    updateUserInfo(
      id: String!
      firstName: String
      lastName: String
      email: String
      phoneNumber: String
      licenseImageUrl: String
      insuranceImageUrl: String
      city: String
    ): User!
  }
`;
