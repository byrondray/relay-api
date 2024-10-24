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

  type LocationData {
    lat: Float!
    lon: Float!
    senderId: String!
    timestamp: String!
  }

  type Query {
    getCommunityCenters(lat: Float!, lon: Float!): [CommunityCenter!]!
    filterSchoolsByName(name: String!): [School!]!
  }

  type Mutation {
    sendLocation(carpoolId: String!, lat: Float!, lon: Float!): LocationData
  }

  type Subscription {
    locationReceived(recipientId: String!): LocationData
  }
`;

export { mapDataTypeDefs };
