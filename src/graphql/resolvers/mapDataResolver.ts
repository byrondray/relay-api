import { PubSub } from "graphql-subscriptions";
import {
  getCommunityCenters,
  filterSchoolsByName,
} from "../../services/mapData.service";
import { ApolloError } from "apollo-server-errors";
import { FirebaseUser } from "./userResolvers";
import { getDB } from "../../database/client";
import { requests } from "../../database/schema/carpoolRequests";
import { carpools } from "../../database/schema/carpool";
import { eq, sql } from "drizzle-orm";
import { users } from "../../database/schema/users";
import {
  sendCarpoolEndNotification,
  sendCarpoolNotification,
} from "../../utils/aiNotifications";
import { children } from "../../database/schema/children";
import { childToRequest } from "../../database/schema/requestToChildren";
import { calculateDistance } from "../../utils/findDistance";

const notifiedEvents = new Set<string>();
const notificationTracker = new Set<string>();

const db = getDB();

const pubsub = new PubSub();

export const mapDataResolver = {
  Query: {
    getCommunityCenters: async (
      _: any,
      { lat, lon }: { lat: number; lon: number },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const result = await getCommunityCenters(lat, lon);
      return result.slice(0, 5);
    },

    filterSchoolsByName: async (
      _: any,
      { name }: { name: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }
      return await filterSchoolsByName(name);
    },
  },

  Mutation: {
    sendLocation: async (
      _: any,
      {
        carpoolId,
        lat,
        lon,
        nextStop,
        timeToNextStop,
        totalTime,
        timeUntilNextStop,
        isLeaving,
        isFinalDestination,
      }: {
        carpoolId: string;
        lat: number;
        lon: number;
        nextStop: { address: string; requestId: string };
        timeToNextStop: string;
        totalTime: string;
        timeUntilNextStop: string;
        isLeaving: boolean;
        isFinalDestination: boolean;
      },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const carpoolParticipants = await db
        .select({
          parentId: users.id,
          parentName: users.firstName,
          parentExpoToken: users.expoPushToken || "",
          childNames: sql`GROUP_CONCAT(${children.firstName}, ', ')`.as(
            "childNames"
          ),
        })
        .from(requests)
        .innerJoin(users, eq(requests.parentId, users.id))
        .innerJoin(childToRequest, eq(requests.id, childToRequest.requestId))
        .innerJoin(children, eq(childToRequest.childId, children.id))
        .where(eq(requests.carpoolId, carpoolId))
        .groupBy(users.id);

      if (!carpoolParticipants || carpoolParticipants.length === 0) {
        throw new ApolloError("No participants found for the carpool");
      }

      const carpool = await db
        .select({
          driverName: users.firstName,
          destination: carpools.endAddress,
          currentLocation: carpools.startAddress,
        })
        .from(carpools)
        .innerJoin(users, eq(carpools.driverId, users.id))
        .where(eq(carpools.id, carpoolId));

      if (!carpool || carpool.length === 0) {
        throw new ApolloError("Carpool not found");
      }

      const locationData = {
        senderId: currentUser.uid,
        lat,
        lon,
        timestamp: new Date().toISOString(),
      };

      // Notify for "leaving"
      const leavingEventKey = `LEAVING_${carpoolId}`;
      if (isLeaving && !notificationTracker.has(leavingEventKey)) {
        notificationTracker.add(leavingEventKey);

        for (const participant of carpoolParticipants) {
          const notificationParams = {
            senderId: currentUser.uid,
            driverName: carpool[0].driverName,
            nextStop: nextStop.address,
            nextStopTime: timeToNextStop,
            currentLocation: carpool[0].currentLocation,
            destination: carpool[0].destination,
            parentName: participant.parentName,
            parentExpoToken: participant.parentExpoToken || "",
            childrenNames: (participant.childNames as string).split(", "),
          };

          const aiMessage = await sendCarpoolNotification(notificationParams);

          pubsub.publish(`FOREGROUND_NOTIFICATION_${participant.parentId}`, {
            foregroundNotification: {
              message: aiMessage,
              timestamp: new Date().toISOString(),
              senderId: currentUser.uid,
            },
          });
        }
      }

      // Notify for "near stop"
      const nearStopEventKey = `NEAR_STOP_${nextStop.requestId}`;
      if (!notificationTracker.has(nearStopEventKey)) {
        const nextStopDetails = await db
          .select({
            parentId: requests.parentId,
            startingLat: requests.startingLatitude,
            startingLon: requests.startingLongitude,
            parentName: users.firstName,
            parentExpoToken: users.expoPushToken || "",
            childNames: sql`GROUP_CONCAT(${children.firstName}, ', ')`.as(
              "childNames"
            ),
          })
          .from(requests)
          .innerJoin(users, eq(requests.parentId, users.id))
          .innerJoin(childToRequest, eq(requests.id, childToRequest.requestId))
          .innerJoin(children, eq(childToRequest.childId, children.id))
          .where(eq(requests.id, nextStop.requestId))
          .groupBy(users.id, requests.id);

        if (!nextStopDetails || nextStopDetails.length === 0) {
          throw new ApolloError("Next stop details not found");
        }

        const stopCoordinates = {
          latitude: parseFloat(nextStopDetails[0].startingLat),
          longitude: parseFloat(nextStopDetails[0].startingLon),
        };

        const driverCoordinates = { latitude: lat, longitude: lon };
        const distanceToStop = calculateDistance(
          driverCoordinates.latitude,
          driverCoordinates.longitude,
          stopCoordinates.latitude,
          stopCoordinates.longitude
        );

        if (distanceToStop <= 50) {
          notificationTracker.add(nearStopEventKey);

          for (const participant of nextStopDetails) {
            const notificationParams = {
              senderId: currentUser.uid,
              driverName: carpool[0].driverName,
              nextStop: nextStop.address,
              nextStopTime: timeToNextStop,
              currentLocation: `${lat}, ${lon}`,
              destination: carpool[0].destination,
              parentName: participant.parentName,
              parentExpoToken: participant.parentExpoToken || "",
              childrenNames: (participant.childNames as string).split(", "),
            };

            const aiMessage = await sendCarpoolNotification(notificationParams);

            pubsub.publish(`FOREGROUND_NOTIFICATION_${participant.parentId}`, {
              foregroundNotification: {
                message: aiMessage,
                timestamp: new Date().toISOString(),
                senderId: currentUser.uid,
              },
            });
          }
        }
      }

      // Notify for "final destination"
      const finalDestinationKey = `FINAL_${carpoolId}`;
      if (isFinalDestination && !notificationTracker.has(finalDestinationKey)) {
        notificationTracker.add(finalDestinationKey);

        for (const participant of carpoolParticipants) {
          const endNotificationParams = {
            senderId: currentUser.uid,
            driverName: carpool[0].driverName,
            destination: carpool[0].destination,
            parentName: participant.parentName,
            parentExpoToken: participant.parentExpoToken || "",
            childrenNames: (participant.childNames as string).split(", "),
          };

          const aiMessage = await sendCarpoolEndNotification(
            endNotificationParams
          );

          pubsub.publish(`FOREGROUND_NOTIFICATION_${participant.parentId}`, {
            foregroundNotification: {
              message: aiMessage,
              timestamp: new Date().toISOString(),
              senderId: currentUser.uid,
            },
          });
        }
      }

      for (const participant of carpoolParticipants) {
        pubsub.publish(`LOCATION_SENT_${participant.parentId}`, {
          locationReceived: locationData,
        });
      }

      return locationData;
    },
  },

  Subscription: {
    locationReceived: {
      subscribe: async (_: any, { recipientId }: { recipientId: string }) => {
        if (!recipientId) {
          throw new ApolloError("Recipient ID must be provided.");
        }
        return pubsub.asyncIterator(`LOCATION_SENT_${recipientId}`);
      },
      resolve: (payload: {
        locationReceived: {
          lat: number;
          lon: number;
          senderId: string;
          timestamp: string;
        };
      }) => {
        return payload.locationReceived;
      },
    },
    foregroundNotification: {
      subscribe: async (_: any, { recipientId }: { recipientId: string }) => {
        if (!recipientId) {
          throw new ApolloError("Recipient ID must be provided.");
        }

        return pubsub.asyncIterator(`FOREGROUND_NOTIFICATION_${recipientId}`);
      },
      resolve: (payload: {
        foregroundNotification: {
          message: string;
          timestamp: string;
          senderId: string;
        };
      }) => {
        console.log("Foreground Notification Payload:", payload);
        return payload.foregroundNotification;
      },
    },
  },
};
