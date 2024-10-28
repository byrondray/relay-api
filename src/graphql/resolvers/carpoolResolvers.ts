import { ApolloError } from "apollo-server-errors";
import { getDB } from "../../database/client";
import { carpools } from "../../database/schema/carpool";
import { requests } from "../../database/schema/carpoolRequests";
import { users } from "../../database/schema/users";
import { children } from "../../database/schema/children";
import { eq, and, gte, lt } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { type FirebaseUser } from "./userResolvers";

const db = getDB();

export const carpoolResolvers = {
  Query: {
    getCarpoolsByGroup: async (
      _: any,
      { groupId }: { groupId: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const today = new Date().toISOString().split("T")[0];

      const result = await db
        .select()
        .from(carpools)
        .where(
          and(eq(carpools.groupId, groupId), gte(carpools.departureDate, today))
        );

      return result;
    },

    getPastCarpools: async (
      _: any,
      { userId }: { userId: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser || currentUser.uid !== userId) {
        throw new ApolloError("Authentication required");
      }

      const today = new Date().toISOString().split("T")[0];

      const result = await db
        .select()
        .from(carpools)
        .where(
          and(eq(carpools.driverId, userId), lt(carpools.departureDate, today))
        );

      return result;
    },

    getCurrentCarpools: async (
      _: any,
      { userId }: { userId: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser || currentUser.uid !== userId) {
        throw new ApolloError("Authentication required");
      }

      const today = new Date().toISOString().split("T")[0];

      const result = await db
        .select()
        .from(carpools)
        .where(
          and(eq(carpools.driverId, userId), gte(carpools.departureDate, today))
        );

      return result;
    },

    getCarpoolsByGroupsWithApprovedCarpoolers: async (
      _: any,
      { groupId }: { groupId: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const today = new Date().toISOString().split("T")[0];

      const carpoolsInGroup = await db
        .select()
        .from(carpools)
        .where(
          and(eq(carpools.groupId, groupId), gte(carpools.departureDate, today))
        );

      if (carpoolsInGroup.length === 0) {
        return [];
      }

      const carpoolIds = carpoolsInGroup.map((carpool) => carpool.id);

      const approvedRequests = await db
        .select({
          carpoolId: requests.carpoolId,
          parentId: requests.parentId,
          childId: requests.childId,
          isApproved: requests.isApproved,
          childFirstName: children.firstName,
          parentName: users.firstName,
        })
        .from(requests)
        .innerJoin(children, eq(requests.childId, children.id))
        .innerJoin(users, eq(requests.parentId, users.id))
        .where(
          and(
            eq(requests.isApproved, 1),
            gte(carpools.departureDate, today),
            eq(carpools.groupId, groupId)
          )
        );

      return carpoolsInGroup.map((carpool) => ({
        ...carpool,
        approvedCarpoolers: approvedRequests.filter(
          (request) => request.carpoolId === carpool.id
        ),
      }));
    },
    getCarpoolersByGroupWithoutApprovedRequests: async (
      _: any,
      {
        groupId,
        date,
        time,
        endingAddress,
      }: { groupId: string; date: string; time: string; endingAddress: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const today = new Date().toISOString().split("T")[0];

      // const carpoolsInGroup = await db
      //   .select()
      //   .from(carpools)
      //   .where(
      //     and(eq(carpools.groupId, groupId), gte(carpools.departureDate, today))
      //   );

      // if (carpoolsInGroup.length === 0) {
      //   return [];
      // }

      // const carpoolIds = carpoolsInGroup.map((carpool) => carpool.id);

      const notApprovedRequests = await db
        .select({
          id: requests.id,
          carpoolId: requests.carpoolId,
          parentId: requests.parentId,
          childId: requests.childId,
          groupId: requests.groupId,
          isApproved: requests.isApproved,
          startAddress: requests.startingAddress,
          endAddress: requests.endingAddress,
          startingLat: requests.startingLatitude,
          startingLon: requests.startingLongitude,
          endingLat: requests.endingLatitude,
          endingLon: requests.endingLongitude,
          pickupTime: requests.pickupTime,
          createdAt: requests.createdAt,
        })
        .from(requests)
        .where(
          and(
            eq(requests.isApproved, 0),
            eq(requests.groupId, groupId),
            // gte(carpools.departureDate, today),
          )
        );

      console.log("notApprovedRequests", notApprovedRequests);

      return notApprovedRequests;
    },
  },

  Mutation: {
    createCarpool: async (
      _: any,
      {
        driverId,
        vehicleId,
        groupId,
        startAddress,
        endAddress,
        startLat,
        startLon,
        endLat,
        endLon,
        departureDate,
        departureTime,
        extraCarSeat,
        winterTires,
        tripPreferences,
      }: any,
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser || currentUser.uid !== driverId) {
        throw new ApolloError("Authentication required");
      }

      if (!driverId || !vehicleId || !groupId || !startAddress || !endAddress) {
        throw new ApolloError("Missing required fields");
      }

      const newCarpool = {
        id: uuid(),
        driverId,
        vehicleId,
        groupId,
        startAddress,
        endAddress,
        startLat,
        startLon,
        endLat,
        endLon,
        departureDate,
        departureTime,
        extraCarSeat: extraCarSeat ? 1 : 0,
        winterTires: winterTires ? 1 : 0,
        tripPreferences,
        createdAt: new Date().toISOString(),
      };

      const result = await db.insert(carpools).values(newCarpool);

      if (result) {
        return newCarpool;
      } else {
        throw new ApolloError("Failed to create carpool");
      }
    },

    createRequest: async (
      _: any,
      {
        parentId,
        childId,
        carpoolId,
        groupId,
        startingAddress,
        endingAddress,
        startingLat,
        startingLon,
        endingLat,
        endingLon,
        pickupTime,
      }: {
        parentId: string;
        childId: string;
        groupId: string;
        startingAddress: string;
        endingAddress: string;
        startingLat: number;
        startingLon: number;
        endingLat: number;
        endingLon: number;
        pickupTime: string;
        carpoolId?: string;
      },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser || currentUser.uid !== parentId) {
        throw new ApolloError("Authentication required");
      }

      if (!parentId || !childId) {
        throw new ApolloError("Missing required fields");
      }

      const newRequest = {
        id: uuid(),
        parentId,
        childId,
        carpoolId: carpoolId || "",
        groupId,
        startingAddress,
        endingAddress,
        startingLatitude: startingLat.toString(),
        startingLongitude: startingLon.toString(),
        endingLatitude: endingLat.toString(),
        endingLongitude: endingLon.toString(),
        pickupTime,
        isApproved: 0,
        createdAt: new Date().toISOString(),
      };

      const result = await db.insert(requests).values(newRequest);

      if (result) {
        return newRequest;
      } else {
        throw new ApolloError("Failed to create request");
      }
    },

    approveRequest: async (
      _: any,
      { requestId }: { requestId: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const request = await db
        .select()
        .from(requests)
        .where(eq(requests.id, requestId));

      if (request.length === 0) {
        throw new ApolloError("Request not found");
      }

      const updatedRequest = await db
        .update(requests)
        .set({ isApproved: 1 })
        .where(eq(requests.id, requestId))
        .returning();

      if (updatedRequest.length > 0) {
        return updatedRequest[0];
      } else {
        throw new ApolloError("Failed to approve request");
      }
    },
  },
};
