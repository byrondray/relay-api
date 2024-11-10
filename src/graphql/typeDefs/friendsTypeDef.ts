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

  type FriendResponse {
    message: String!
  }

  type Query {
    getFriends: [FriendsWithUserInfo!]!
    getFriend(friendId: String!): FriendsWithUserInfo!
  }

  type Mutation {
    addFriend(friendId: String!): Friend!
    deleteFriend(friendId: String!): FriendResponse!
  }
`;
