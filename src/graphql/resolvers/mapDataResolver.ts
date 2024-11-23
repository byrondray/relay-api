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
import { and, eq, ne, sql } from "drizzle-orm";
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

      for (const participant of carpoolParticipants) {
        pubsub.publish(`LOCATION_SENT_${participant.parentId}`, {
          locationReceived: locationData,
        });
      }

      return locationData;
    },
    sendNotificationInfo: async (
      _: any,
      {
        carpoolId,
        notificationType,
        lat,
        lon,
        nextStop,
        timeToNextStop,
        timeUntilNextStop,
        isFinalDestination,
      }: {
        carpoolId: string;
        notificationType: "LEAVING" | "NEAR_STOP" | "FINAL_DESTINATION";
        lat?: number;
        lon?: number;
        nextStop?: { address: string; requestId: string };
        timeToNextStop?: string;
        timeUntilNextStop?: string;
        isFinalDestination?: boolean;
      },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      if (!lat || !lon) {
        return false;
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
        .where(
          and(
            eq(requests.carpoolId, carpoolId),
          )
        )
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

      const driverName = carpool[0].driverName;

      switch (notificationType) {
        case "LEAVING": {
          const notificationKey = `LEAVING_${carpoolId}`;
          if (!notificationTracker.has(notificationKey)) {
            notificationTracker.add(notificationKey);

            for (const participant of carpoolParticipants) {
              const notificationParams = {
                senderId: currentUser.uid,
                driverName,
                nextStop: nextStop?.address || "",
                nextStopTime: timeToNextStop || "",
                currentLocation: carpool[0].currentLocation,
                destination: carpool[0].destination,
                parentName: participant.parentName,
                parentExpoToken: participant.parentExpoToken || "",
                childrenNames: (participant.childNames as string).split(", "),
              };

              const message = await sendCarpoolNotification(notificationParams);
              console.log("Message:", message);

              pubsub.publish(
                `FOREGROUND_NOTIFICATION_${participant.parentId}`,
                {
                  foregroundNotification: {
                    message: `Driver ${driverName} is leaving for the next stop.`,
                    timestamp: new Date().toISOString(),
                    senderId: currentUser.uid,
                  },
                }
              );
            }
          }
          break;
        }
        case "NEAR_STOP": {
          if (!nextStop) {
            throw new ApolloError(
              "Next stop details are required for NEAR_STOP notification"
            );
          }

          const notificationKey = `NEAR_STOP_${nextStop.requestId}`;
          if (!notificationTracker.has(notificationKey) && lat && lon) {
            const stopCoordinates = {
              latitude: lat,
              longitude: lon,
            };

            const driverCoordinates = { latitude: lat, longitude: lon };
            const distanceToStop = calculateDistance(
              driverCoordinates.latitude,
              driverCoordinates.longitude,
              stopCoordinates.latitude,
              stopCoordinates.longitude
            );

            if (distanceToStop <= 50) {
              notificationTracker.add(notificationKey);

              for (const participant of carpoolParticipants) {
                const notificationParams = {
                  senderId: currentUser.uid,
                  driverName,
                  nextStop: nextStop.address,
                  nextStopTime: timeToNextStop || "",
                  currentLocation: `${lat}, ${lon}`,
                  destination: carpool[0].destination,
                  parentName: participant.parentName,
                  parentExpoToken: participant.parentExpoToken || "",
                  childrenNames: (participant.childNames as string).split(", "),
                };

                const message = await sendCarpoolNotification(
                  notificationParams
                );

                console.log("Message:", message);

                pubsub.publish(
                  `FOREGROUND_NOTIFICATION_${participant.parentId}`,
                  {
                    foregroundNotification: {
                      message: `Driver ${driverName} is near the next stop at ${nextStop.address}.`,
                      timestamp: new Date().toISOString(),
                      senderId: currentUser.uid,
                    },
                  }
                );
              }
            }
          }
          break;
        }
        case "FINAL_DESTINATION": {
          const notificationKey = `FINAL_${carpoolId}`;
          if (!notificationTracker.has(notificationKey)) {
            notificationTracker.add(notificationKey);

            for (const participant of carpoolParticipants) {
              const endNotificationParams = {
                senderId: currentUser.uid,
                driverName,
                destination: carpool[0].destination,
                parentName: participant.parentName,
                parentExpoToken: participant.parentExpoToken || "",
                childrenNames: (participant.childNames as string).split(", "),
              };

              const message = await sendCarpoolEndNotification(
                endNotificationParams
              );

              console.log("Message:", message);

              pubsub.publish(
                `FOREGROUND_NOTIFICATION_${participant.parentId}`,
                {
                  foregroundNotification: {
                    message: `Driver ${driverName} has reached the final destination.`,
                    timestamp: new Date().toISOString(),
                    senderId: currentUser.uid,
                  },
                }
              );
            }
          }
          break;
        }
        default:
          throw new ApolloError("Invalid notification type");
      }

      return true;
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

        let message = payload.foregroundNotification.message;

        if (!message) {
          message =
            "There was a problem creating the message for the notification";
        }

        return payload.foregroundNotification;
      },
    },
  },
};
