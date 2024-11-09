import { gql } from "graphql-tag";

export const friendsTypeDefs = gql`
  type Friend {
    id: ID!
    firstName: String!
    lastName: String
    email: String!
    phoneNumber: String
    city: String
    licenseImageUrl: String
    insuranceImageUrl: String
    imageUrl: String
    createdAt: String
  }

  type FriendsWithUserInfo {
    id: ID!
    userId: String!
    createdAt: String!
    friends: Friend!
  }

  type Query {
    getFriends: [FriendsWithUserInfo!]!
    getFriend(userId: String!, friendId: String!): Friend!
  }

  type Mutation {
    addFriend(userId: String!, friendId: String!): Friend!
    deleteFriend(userId: String!, friendId: String!): Friend!
  }
`;
