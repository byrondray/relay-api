import { gql } from "graphql-tag";

export const groupTypeDefs = gql`
  type Group {
    id: ID!
    name: String!
    members: [User!]!
  }

  type Query {
    getGroup(id: ID!): Group
    getGroups: [Group!]!
    getGroupWithUsers(id: ID!): Group!
  }

  type Mutation {
    createGroup(name: String!): Group!
    addMemberToGroup(groupId: String!, userId: String!): String!
    deleteMemberFromGroup(groupId: String!, userId: String!): String!
  }
`;
