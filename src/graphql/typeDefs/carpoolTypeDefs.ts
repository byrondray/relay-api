import { gql } from "graphql-tag";

export const carpoolTypeDefs = gql`
  type Carpool {
    id: String!
    driverId: String!
    vehicleId: String!
    groupId: String!
    startAddress: String!
    endAddress: String!
    startLat: Float!
    startLon: Float!
    endLat: Float!
    endLon: Float!
    departureDate: String!
    departureTime: String!
    extraCarSeat: Boolean!
    winterTires: Boolean!
    tripPreferences: String
    estimatedTime: String
    createdAt: String!
  }

  type Request {
    id: String!
    carpoolId: String
    parentId: String!
    childId: String!
    isApproved: Boolean!
    createdAt: String!
  }

  type ApprovedCarpooler {
    parentName: String!
    childFirstName: String!
  }

  input CreateCarpoolInput {
    driverId: String!
    vehicleId: String!
    groupId: String!
    startAddress: String!
    endAddress: String!
    startLat: Float!
    startLon: Float!
    endLat: Float!
    endLon: Float!
    departureDate: String!
    departureTime: String!
    extraCarSeat: Boolean
    winterTires: Boolean
    tripPreferences: String
  }

  input CreateRequestInput {
    carpoolId: String
    parentId: String!
    childId: String!
  }

  type Query {
    getCarpoolsByGroup(groupId: String!): [Carpool!]
    getPastCarpools(userId: String!): [Carpool!]
    getCurrentCarpools(userId: String!): [Carpool!]
    getCarpoolsByGroupsWithApprovedCarpoolers(
      groupId: String!
    ): [CarpoolWithCarpoolers!]
  }

  type CarpoolWithCarpoolers {
    id: String!
    driverId: String!
    vehicleId: String!
    groupId: String!
    startAddress: String!
    endAddress: String!
    departureDate: String!
    departureTime: String!
    approvedCarpoolers: [ApprovedCarpooler!]
  }

  type Mutation {
    createCarpool(input: CreateCarpoolInput!): Carpool!
    createRequest(input: CreateRequestInput!): Request!
    approveRequest(requestId: String!): Request!
  }
`;
