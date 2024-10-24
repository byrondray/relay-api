import { ApolloError } from "apollo-server-errors";
import { getDB } from "../../database/client";
import { groupMessages } from "../../database/schema/groupMessages";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { FirebaseUser } from "./userResolvers";

const db = getDB();

export const groupMessageResolvers = {
  Query: {
    getGroupMessages: async (
      _: any,
      { groupId }: { groupId: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const result = await db
        .select()
        .from(groupMessages)
        .where(eq(groupMessages.groupId, groupId));

      return result;
    },
  },

  Mutation: {
    createGroupMessage: async (
      _: any,
      { groupId, message }: { groupId: string; message: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const groupMessageData = {
        id: uuid(),
        groupId,
        userId: currentUser.uid,
        message,
        createdAt: new Date().toISOString(),
      };

      const result = await db.insert(groupMessages).values(groupMessageData);

      if (result) {
        return groupMessageData;
      }
    },
  },
};
