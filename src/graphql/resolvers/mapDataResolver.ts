import { PubSub } from "graphql-subscriptions";
import {
  getCommunityCenters,
  filterSchoolsByName,
} from "../../services/mapData.service";
import { ApolloError } from "apollo-server-errors";
import { getActiveCarpoolMembers } from "../../services/carpool.service";
import { FirebaseUser } from "./userResolvers";
import { getDB } from "../../database/client";
import { requests } from "../../database/schema/carpoolRequests";
import { carpools } from "../../database/schema/carpool";
import { and, eq, gte, ne } from "drizzle-orm";
import { users } from "../../database/schema/users";
import { sendPushNotification } from "../../utils/pushNotification";

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
      { carpoolId, lat, lon }: { carpoolId: string; lat: number; lon: number },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const activeParticipants = await db
        .select({
          userId: requests.parentId,
          expoPushToken: users.expoPushToken,
        })
        .from(requests)
        .innerJoin(carpools, eq(requests.carpoolId, carpools.id))
        .innerJoin(users, eq(requests.parentId, users.id))
        .where(
          and(
            eq(requests.carpoolId, carpoolId),
            eq(requests.isApproved, 1),
            ne(requests.parentId, currentUser.uid)
          )
        );

      if (!activeParticipants || activeParticipants.length === 0) {
        return null;
      }

      const locationData = {
        senderId: currentUser.uid,
        lat,
        lon,
        timestamp: new Date().toISOString(),
      };

      for (const participant of activeParticipants) {
        pubsub.publish(`LOCATION_SENT_${participant.userId}`, {
          locationReceived: locationData,
        });

        if (participant.expoPushToken) {
          const messageText = `New location update from ${currentUser.uid}`;
          const title = "Location Update";
          await sendPushNotification(
            participant.expoPushToken,
            messageText,
            currentUser.uid,
            title
          );
        } else {
          console.warn(
            `No Expo Push Token available for participant ${participant.userId}`
          );
        }
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
  },
};
