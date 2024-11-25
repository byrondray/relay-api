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
    carpoolId: String!
    driverId: String!
    senderId: String!
    timestamp: String!
    nextStop: NextStop
  }

  type NextStop {
    address: String!
    requestId: String!
  }

  type Query {
    getCommunityCenters(lat: Float!, lon: Float!): [CommunityCenter!]!
    filterSchoolsByName(name: String!): [School!]!
  }

  enum NotificationType {
    LEAVING
    NEAR_STOP
    FINAL_DESTINATION
  }

  type Mutation {
    sendLocation(
      carpoolId: String!
      lat: Float!
      lon: Float!
      nextStop: NextStopInput!
      timeToNextStop: String!
      totalTime: String!
      timeUntilNextStop: String!
      isLeaving: Boolean!
      isFinalDestination: Boolean!
    ): LocationData
  }

  type Mutation {
    resetNotificationTracking: Boolean!
  }

  type Mutation {
    sendNotificationInfo(
      carpoolId: String!
      notificationType: NotificationType!
      lat: Float!
      lon: Float!
      nextStop: NextStopInput!
      timeToNextStop: String!
      timeUntilNextStop: String!
      isFinalDestination: Boolean!
    ): Boolean
  }
  input NextStopInput {
    address: String!
    requestId: String!
  }

  type Subscription {
    locationReceived(recipientId: String!): LocationData
    foregroundNotification(recipientId: String!): ForegroundNotification
  }

  type ForegroundNotification {
    message: String!
    timestamp: String!
    senderId: String!
  }

  type Subscription {
    locationReceived(recipientId: String!): LocationData
  }
`;

export { mapDataTypeDefs };
