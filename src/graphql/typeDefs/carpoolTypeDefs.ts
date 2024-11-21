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

  type CarpoolWithDriver {
    id: String!
    driver: User!
    vehicle: Vehicle!
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
    groupId: String!
    isApproved: Boolean!
    startAddress: String!
    endAddress: String!
    startingLat: Float!
    startingLon: Float!
    endingLat: Float!
    endingLon: Float!
    pickupTime: String!
    createdAt: String!
    children: [Child!]!
  }

  type Child {
    id: ID!
    userId: String!
    firstName: String!
    schoolId: String!
    schoolEmailAddress: String
    imageUrl: String
    createdAt: String!
  }

  type ChildWithParent {
    id: ID!
    firstName: String!
    schoolId: String!
    schoolEmailAddress: String
    imageUrl: String
    parent: User!
  }

  type RequestWithChildrenAndParent {
    id: ID!
    carpoolId: String
    parentId: String!
    groupId: String!
    isApproved: Int!
    startAddress: String!
    endAddress: String!
    startingLat: String!
    startingLon: String!
    endingLat: String!
    endingLon: String!
    pickupTime: String!
    createdAt: String!
    children: [ChildWithParent!]!
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
    requestIds: [String!]!
    driverChildIds: [String!]!
  }

  input CreateRequestInput {
    carpoolId: String
    parentId: String!
    childIds: [String!]!
    groupId: String!
    startingAddress: String!
    endingAddress: String!
    startingLat: Float!
    startingLon: Float!
    endingLat: Float!
    endingLon: Float!
    pickupTime: String!
  }

  type CarpoolWithRequests {
    id: String!
    driverId: String!
    vehicleId: String!
    groupId: String!
    startAddress: String!
    endAddress: String!
    departureDate: String!
    departureTime: String!
    startLat: Float!
    startLon: Float!
    endLat: Float!
    endLon: Float!
    requests: [RequestWithParentAndChild!]
  }

  type Carpool {
    id: String!
    driverId: String!
    vehicleId: String!
    groupId: String!
    startAddress: String!
    endAddress: String!
    departureDate: String!
    departureTime: String!
  }

  type RequestWithParentAndChild {
    id: String!
    carpoolId: String
    parent: User!
    child: Child!
    pickupTime: String!
    startAddress: String!
    startLat: Float!
    startLon: Float!
  }

  type UserCarpoolsAndRequests {
    carpools: [CarpoolWithDriver!]!
    requests: [RequestWithParentAndChild!]!
  }

  type Query {
    getCarpoolsByGroup(groupId: String!): [Carpool!]
    getPastCarpools(userId: String!): [Carpool!]
    getCurrentCarpools(userId: String!): [Carpool!]
    getCarpoolsByGroupsWithApprovedCarpoolers(
      groupId: String!
    ): [CarpoolWithCarpoolers!]
    getCarpoolersByGroupWithoutApprovedRequests(
      groupId: String!
      date: String!
      time: String!
      endingAddress: String!
    ): [RequestWithChildrenAndParent!]
    getCarpoolWithRequests(carpoolId: String!): CarpoolWithRequests!
    getUserCarpoolsAndRequests(userId: String!): UserCarpoolsAndRequests!
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
