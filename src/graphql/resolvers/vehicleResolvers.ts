import { ApolloError } from "apollo-server-errors";
import { getDB } from "../../database/client";
import { vehicle } from "../../database/schema/vehicle";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

const db = getDB();

export const vehicleResolvers = {
  Query: {
    getVehicle: async (
      _: any,
      { id }: { id: string },
      { currentUser }: any
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const result = await db.select().from(vehicle).where(eq(vehicle.id, id));

      if (result.length > 0) {
        return result[0];
      }

      return null;
    },
    getVehicleForUser: async (
      _: any,
      { userId }: { userId: string },
      { currentUser }: any
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const result = await db
        .select()
        .from(vehicle)
        .where(eq(vehicle.userId, userId));

      return result;
    },
  },

  Mutation: {
    createVehicle: async (
      _: any,
      { userId, make, model, year, licensePlate, color }: any,
      { currentUser }: any
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }
      const vehicleData = {
        id: uuid(),
        userId: currentUser.id,
        make,
        model,
        year,
        licensePlate,
        color,
      };

      const result = await db.insert(vehicle).values(vehicleData);

      if (result) {
        return vehicleData;
      }
    },
  },
};
