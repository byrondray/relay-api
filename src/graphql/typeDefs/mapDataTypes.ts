import { gql } from "graphql-tag";

const mapDataTypeDefs = gql`
  type CommunityCenter {
    id: ID!
    name: String!
    address: String!
    lat: Float!
    lon: Float!
    distance: Float!
  }

  type School {
    id: ID!
    districtNumber: Int!
    name: String!
    address: String!
    city: String!
  }

  type Query {
    getCommunityCenters(lat: Float!, lon: Float!): [CommunityCenter!]!

    filterSchoolsByName(name: String!): [School!]!
  }
`;

export { mapDataTypeDefs };
