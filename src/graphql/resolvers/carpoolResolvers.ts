import { ApolloError } from "apollo-server-errors";
import { getDB } from "../../database/client";
import { carpools } from "../../database/schema/carpool";
import { RequestInsert, requests } from "../../database/schema/carpoolRequests";
import { users } from "../../database/schema/users";
import { children } from "../../database/schema/children";
import { eq, and, gte, lt, inArray } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { type FirebaseUser } from "./userResolvers";
import { childToRequest } from "../../database/schema/requestToChildren";
import {
  CreateCarpoolInput,
  CreateRequestInput,
  RequestWithChildrenAndParent,
} from "../generated";
import { groups } from "../../database/schema/groups";

const db = getDB();

export const carpoolResolvers = {
  Query: {
    getCarpoolWithRequests: async (
      _: any,
      { carpoolId }: { carpoolId: string },
      { currentUser }: FirebaseUser
    ) => {
      console.log(carpoolId, "carpoolId");
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      // Fetch the carpool details
      const carpool = await db
        .select()
        .from(carpools)
        .where(eq(carpools.id, carpoolId))
        .limit(1);

      if (!carpool.length) {
        throw new ApolloError("Carpool not found");
      }

      // Fetch the requests with all necessary details
      const requestsWithDetails = await db
        .select({
          requestId: requests.id,
          parentId: requests.parentId,
          parentName: users.firstName,
          parentEmail: users.email,
          parentImageUrl: users.imageUrl,
          childId: children.id,
          childFirstName: children.firstName,
          childImageUrl: children.imageUrl,
          childSchoolId: children.schoolId,
          startAddress: requests.startingAddress, // Include starting address
        })
        .from(requests)
        .innerJoin(users, eq(requests.parentId, users.id))
        .innerJoin(childToRequest, eq(childToRequest.requestId, requests.id))
        .innerJoin(children, eq(childToRequest.childId, children.id))
        .where(eq(requests.carpoolId, carpoolId));

      // Return the carpool with associated requests and starting address
      return {
        ...carpool[0],
        requests: requestsWithDetails.map((request) => ({
          id: request.requestId,
          startAddress: request.startAddress, // Include starting address here
          parent: {
            id: request.parentId,
            firstName: request.parentName,
            email: request.parentEmail,
            imageUrl: request.parentImageUrl,
          },
          child: {
            id: request.childId,
            firstName: request.childFirstName,
            imageUrl: request.childImageUrl,
            schoolId: request.childSchoolId,
          },
        })),
      };
    },
  },

  Mutation: {
    createCarpool: async (
      _: any,
      { input }: { input: CreateCarpoolInput },
      { currentUser }: FirebaseUser
    ) => {
      const {
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
        requestIds,
        driverChildIds,
      } = input;

      console.log(
        driverId,
        "driverId",
        vehicleId,
        "vehicleId",
        groupId,
        "groupId",
        startAddress,
        "startAddress",
        endAddress,
        "endAddress",
        startLat,
        "startLat",
        startLon,
        "startLon",
        endLat,
        "endLat",
        endLon,
        "endLon",
        departureDate,
        "departureDate",
        departureTime,
        "departureTime",
        extraCarSeat,
        "extraCarSeat",
        winterTires,
        "winterTires",
        tripPreferences,
        "tripPreferences",
        requestIds,
        "requestIds",
        driverChildIds,
        "driverChildIds",
        currentUser,
        "currentUser"
      );

      if (!currentUser || currentUser.uid !== driverId) {
        throw new ApolloError("Authentication required");
      }

      if (!driverId || !vehicleId || !groupId || !startAddress || !endAddress) {
        throw new ApolloError("Missing required fields");
      }

      // Create a new carpool
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

      const carpoolResult = await db.insert(carpools).values(newCarpool);

      if (!carpoolResult) {
        throw new ApolloError("Failed to create carpool");
      }

      await Promise.all(
        requestIds.map(async (requestId) => {
          await db
            .update(requests)
            .set({ carpoolId: newCarpool.id, isApproved: 1 })
            .where(eq(requests.id, requestId));
        })
      );

      if (driverChildIds.length > 0) {
        const driverRequest = {
          id: uuid(),
          carpoolId: newCarpool.id,
          parentId: driverId,
          groupId,
          isApproved: 1,
          startingAddress: startAddress,
          endingAddress: endAddress,
          startingLatitude: startLat.toString(),
          startingLongitude: startLon.toString(),
          endingLatitude: endLat.toString(),
          endingLongitude: endLon.toString(),
          pickupTime: departureTime,
          childIds: driverChildIds.join(","),
          createdAt: new Date().toISOString(),
        };

        await db.insert(requests).values(driverRequest);
      }

      return newCarpool;
    },
    createRequest: async (
      _: any,
      { input }: { input: CreateRequestInput },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const {
        parentId,
        childIds,
        carpoolId,
        groupId,
        startingAddress,
        endingAddress,
        startingLat,
        startingLon,
        endingLat,
        endingLon,
        pickupTime,
      } = input;

      // Check for the existence of parentId in users
      const userExists = await db
        .select()
        .from(users)
        .where(eq(users.id, currentUser.uid));
      if (userExists.length === 0) {
        throw new ApolloError("Parent user does not exist in users table");
      }

      // Check for the existence of groupId in groups
      const groupExists = await db
        .select()
        .from(groups)
        .where(eq(groups.id, groupId));
      if (groupExists.length === 0) {
        throw new ApolloError("Group does not exist in groups table");
      }

      // Validate each childId in children
      const childrenExist = await db
        .select()
        .from(children)
        .where(inArray(children.id, childIds));
      if (childrenExist.length !== childIds.length) {
        throw new ApolloError(
          "One or more children do not exist in children table"
        );
      }

      // Create the new request object
      const newRequest = {
        id: uuid(),
        parentId: currentUser.uid,
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

      // Insert the request into the database
      const result = await db.insert(requests).values(newRequest);
      if (!result) {
        throw new ApolloError("Failed to create request");
      }

      // Insert each child-to-request relationship
      await Promise.all(
        childIds.map(async (childId: string) => {
          await db.insert(childToRequest).values({
            id: uuid(),
            childId,
            requestId: newRequest.id,
          });
        })
      );

      // Retrieve associated children for the response
      const associatedChildren = await db
        .select()
        .from(children)
        .where(inArray(children.id, childIds));

      // Return the new request with associated children
      return {
        ...newRequest,
        children: associatedChildren,
      };
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
