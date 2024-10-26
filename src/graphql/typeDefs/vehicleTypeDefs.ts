import { gql } from "graphql-tag";

export const vehicleTypeDefs = gql`
  type Vehicle {
    id: ID!
    userId: String!
    make: String!
    model: String!
    year: String!
    licensePlate: String!
    seats: Int!
    color: String!
    vehicleImageUrl: String
  }

  type Query {
    getVehicle(id: ID!): Vehicle
    getVehicleForUser(userId: String!): [Vehicle!]!
  }

  type Mutation {
    createVehicle(
      make: String!
      model: String!
      year: String!
      licensePlate: String!
      seats: Int!
      color: String!
      imageUrl: String
    ): Vehicle!
  }
`;
