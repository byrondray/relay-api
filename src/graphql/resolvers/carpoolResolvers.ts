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
import { CreateCarpoolInput, CreateRequestInput } from "../generated";
import { groups } from "../../database/schema/groups";
import { vehicle } from "../../database/schema/vehicle";

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

      const approvedRequests = await Promise.all(
        carpoolIds.map(async (carpoolId) => {
          const requestsForCarpool = await db
            .select({
              carpoolId: requests.carpoolId,
              parentId: requests.parentId,
              childFirstName: children.firstName,
              parentName: users.firstName,
            })
            .from(requests)
            .innerJoin(
              childToRequest,
              eq(childToRequest.requestId, requests.id)
            )
            .innerJoin(children, eq(childToRequest.childId, children.id))
            .innerJoin(users, eq(requests.parentId, users.id))
            .where(
              and(eq(requests.isApproved, 1), eq(requests.carpoolId, carpoolId))
            );
          return { carpoolId, requestsForCarpool };
        })
      );

      return carpoolsInGroup.map((carpool) => ({
        ...carpool,
        approvedCarpoolers:
          approvedRequests.find((requests) => requests.carpoolId === carpool.id)
            ?.requestsForCarpool || [],
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

      const notApprovedRequests = await db
        .select({
          id: requests.id,
          carpoolId: requests.carpoolId,
          parentId: requests.parentId,
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
        .where(and(eq(requests.isApproved, 0), eq(requests.groupId, groupId)));

      const requestIds = notApprovedRequests.map((request) => request.id);

      const associatedChildren = await db
        .select({
          requestId: childToRequest.requestId,
          childId: children.id,
          firstName: children.firstName,
          schoolId: children.schoolId,
          schoolEmailAddress: children.schoolEmailAddress,
          imageUrl: children.imageUrl,
          userId: users.id,
          parentFirstName: users.firstName,
          parentLastName: users.lastName,
          parentEmail: users.email,
          parentImageUrl: users.imageUrl,
          parentPhoneNumber: users.phoneNumber,
        })
        .from(childToRequest)
        .innerJoin(children, eq(childToRequest.childId, children.id))
        .innerJoin(users, eq(children.userId, users.id))
        .where(inArray(childToRequest.requestId, requestIds));

      const childrenByRequestId = associatedChildren.reduce((acc, child) => {
        if (!acc[child.requestId]) {
          acc[child.requestId] = [];
        }
        acc[child.requestId].push({
          id: child.childId,
          firstName: child.firstName,
          schoolId: child.schoolId,
          schoolEmailAddress: child.schoolEmailAddress,
          imageUrl: child.imageUrl,
          parent: {
            id: child.userId,
            firstName: child.parentFirstName,
            lastName: child.parentLastName,
            email: child.parentEmail,
            imageUrl: child.parentImageUrl,
            phoneNumber: child.parentPhoneNumber,
          },
        });
        return acc;
      }, {} as Record<string, Array<any>>);

      const res = notApprovedRequests.map((request) => ({
        ...request,
        children: childrenByRequestId[request.id] || [],
      }));
      console.log(res[0].children[0], "result");
      return res;
    },

    getCarpoolWithRequests: async (
      _: any,
      { carpoolId }: { carpoolId: string },
      { currentUser }: FirebaseUser
    ) => {
      console.log(carpoolId, "carpoolId");
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const carpool = await db
        .select()
        .from(carpools)
        .where(eq(carpools.id, carpoolId))
        .limit(1);

      if (!carpool.length) {
        throw new ApolloError("Carpool not found");
      }

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
          startingAddress: requests.startingAddress,
          startingLatitude: requests.startingLatitude,
          startingLongitude: requests.startingLongitude,
        })
        .from(requests)
        .innerJoin(users, eq(requests.parentId, users.id))
        .innerJoin(childToRequest, eq(childToRequest.requestId, requests.id))
        .innerJoin(children, eq(childToRequest.childId, children.id))
        .where(eq(requests.carpoolId, carpoolId));

      return {
        ...carpool[0],
        requests: requestsWithDetails.map((request) => ({
          id: request.requestId,
          startAddress: request.startingAddress,
          startLat: request.startingLatitude,
          startLon: request.startingLongitude,
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
    getUserCarpoolsAndRequests: async (
      _: any,
      { userId }: { userId: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser || currentUser.uid !== userId) {
        throw new ApolloError("Authentication required");
      }

      // Fetch carpools with driver and vehicle info
      const carpoolsByDriver = await db
        .select({
          id: carpools.id,
          driverId: carpools.driverId,
          vehicle: {
            ...vehicle,
          },
          groupId: carpools.groupId,
          startAddress: carpools.startAddress,
          endAddress: carpools.endAddress,
          departureDate: carpools.departureDate,
          departureTime: carpools.departureTime,
          startLat: carpools.startLat,
          startLon: carpools.startLon,
          endLat: carpools.endLat,
          endLon: carpools.endLon,
          driver: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            phoneNumber: users.phoneNumber,
            imageUrl: users.imageUrl,
          },
        })
        .from(carpools)
        .innerJoin(users, eq(users.id, carpools.driverId))
        .innerJoin(vehicle, eq(vehicle.id, carpools.vehicleId))
        .where(eq(carpools.driverId, userId));

      // Fetch requests with parent and child details
      const requestsWithDetails = await db
        .select({
          id: requests.id,
          carpoolId: requests.carpoolId || null,
          pickupTime: requests.pickupTime,
          startAddress: requests.startingAddress,
          parentId: requests.parentId,
          parentName: users.firstName,
          parentEmail: users.email,
          parentImageUrl: users.imageUrl,
          childId: children.id,
          childFirstName: children.firstName,
          childImageUrl: children.imageUrl,
          childSchoolId: children.schoolId,
        })
        .from(requests)
        .innerJoin(users, eq(requests.parentId, users.id))
        .innerJoin(childToRequest, eq(childToRequest.requestId, requests.id))
        .innerJoin(children, eq(childToRequest.childId, children.id))
        .where(eq(requests.parentId, userId));

      return {
        carpools: carpoolsByDriver.map((carpool) => ({
          ...carpool,
        })),
        requests: requestsWithDetails.map((request) => ({
          id: request.id,
          carpoolId: request.carpoolId || null,
          pickupTime: request.pickupTime,
          startAddress: request.startAddress,
          parent: {
            id: request.parentId,
            firstName: request.parentName,
            email: request.parentEmail,
            imageUrl: request.parentImageUrl,
          },
          child: {
            id: request.childId,
            firstName: request.childFirstName,
            schoolId: request.childSchoolId,
            imageUrl: request.childImageUrl,
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
