import { PubSub } from "graphql-subscriptions";
import {
  getCommunityCenters,
  filterSchoolsByName,
} from "../../services/mapData.service";
import { ApolloError } from "apollo-server-errors";
import { getActiveCarpoolMembers } from "../../services/carpool.service";
import { FirebaseUser } from "./userResolvers";

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

      const activeParticipants = await getActiveCarpoolMembers(carpoolId);

      if (!activeParticipants || activeParticipants.length === 0) {
        return null;
      }

      const locationData = {
        senderId: currentUser.uid,
        lat,
        lon,
        timestamp: new Date().toISOString(),
      };

      activeParticipants.forEach((participant: { userId: string }) => {
        pubsub.publish(`LOCATION_SENT_${participant.userId}`, {
          locationReceived: locationData,
        });
      });

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
