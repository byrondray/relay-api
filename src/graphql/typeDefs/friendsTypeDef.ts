import { gql } from "graphql-tag";

export const friendsTypeDefs = gql`
  type Friend {
    id: ID!
    userId: String!
    friendId: String!
    createdAt: String!
  }

  type FriendsWithUserInfo {
    id: ID!
    userId: String!
    createdAt: String!
    friends: [User]!
  }

  type Query {
    getFriends(userId: String!): [Friend!]!
  }

  type Mutation {
    addFriend(userId: String!, friendId: String!): Friend!
    deleteFriend(userId: String!, friendId: String!): Friend!
  }
`;
