import { gql } from "graphql-tag";

export const groupTypeDefs = gql`
  type Group {
    id: ID!
    name: String!
    schoolId: String
    communityCenterId: String
    members: [User!]!
  }

  type AddMemberToGroupResponse {
    message: String!
  }

  type DeleteMemberFromGroupResponse {
    message: String!
  }

  type Query {
    getGroup(id: ID!): Group
    getGroups: [Group!]!
    getGroupWithUsers(id: ID!): Group!
  }

  type Mutation {
    createGroup(
      name: String!
      schoolId: String
      communityCenterId: String
    ): Group!

    addMemberToGroup(
      groupId: String!
      userId: String!
    ): AddMemberToGroupResponse!

    deleteMemberFromGroup(
      groupId: String!
      userId: String!
    ): DeleteMemberFromGroupResponse!
  }
`;
