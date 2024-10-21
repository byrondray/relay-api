import { gql } from "graphql-tag";

export const childTypeDefs = gql`
  type Child {
    id: ID!
    userId: String!
    firstName: String!
    schoolId: String!
    schoolEmailAddress: String
    createdAt: String!
  }

  type Query {
    getChild(id: ID!): Child
    getChildren: [Child!]!
    getChildrenForUser: [Child!]!
  }

  type Mutation {
    createChild(
      firstName: String!
      schoolId: String!
      schoolEmailAddress: String
    ): Child!
  }
`;
