import { ApolloError } from "apollo-server-errors";
import { getDB } from "../../database/client";
import { vehicle } from "../../database/schema/vehicle";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { type FirebaseUser } from "./userResolvers";

const db = getDB();

export const vehicleResolvers = {
  Query: {
    getVehicle: async (
      _: any,
      { id }: { id: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const result = await db.select().from(vehicle).where(eq(vehicle.id, id));

      if (result.length > 0) {
        return result[0];
      }

      console.log(result, "result");

      return null;
    },
    getVehicleForUser: async (
      _: any,
      { userId }: { userId: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const result = await db
        .select({
          id: vehicle.id,
          userId: vehicle.userId,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          licensePlate: vehicle.licensePlate,
          seats: vehicle.numberOfSeats,
          color: vehicle.color,
          vehicleImageUrl: vehicle.vehicleImageUrl,
        })
        .from(vehicle)
        .where(eq(vehicle.userId, userId));

      console.log(result, "result");

      return result.map((v) => ({
        ...v,
        seats: v.seats,
      }));
    },
  },

  Mutation: {
    createVehicle: async (
      _: any,
      {
        userId,
        make,
        model,
        year,
        licensePlate,
        color,
        seats,
        imageUrl,
      }: {
        userId: string;
        make: string;
        model: string;
        year: string;
        licensePlate: string;
        color: string;
        seats: number;
        imageUrl?: string;
      },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const vehicleData = {
        id: uuid(),
        userId: currentUser.uid,
        make,
        model,
        year,
        licensePlate,
        color,
        numberOfSeats: seats,
        vehicleImageUrl: imageUrl,
      };

      const result = await db.insert(vehicle).values(vehicleData);

      if (result) {
        return vehicleData;
      }
    },
  },
};
