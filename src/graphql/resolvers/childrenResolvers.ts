import { ApolloError } from "apollo-server-errors";
import { getDB } from "../../database/client";
import { children } from "../../database/schema/children";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

const db = getDB();

export const childResolvers = {
  Query: {
    getChild: async (_: any, { id }: { id: string }, { currentUser }: any) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const result = await db
        .select()
        .from(children)
        .where(eq(children.id, id));

      if (result.length > 0) {
        return result[0];
      }

      return null;
    },

    getChildren: async (_: any, __: any, { currentUser }: any) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const result = await db.select().from(children);
      return result;
    },

    getChildrenForUser: async (_: any, __: any, { currentUser }: any) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const result = await db
        .select()
        .from(children)
        .where(eq(children.userId, currentUser.id));

      return result;
    },
  },

  Mutation: {
    createChild: async (
      _: any,
      { firstName, schoolId, schoolEmailAddress }: any,
      { currentUser }: any
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const childData = {
        id: uuid(),
        userId: currentUser.id,
        firstName,
        schoolId,
        schoolEmailAddress,
        createdAt: new Date().toISOString(),
      };

      const result = await db.insert(children).values(childData);

      if (result) {
        return childData;
      }
    },
  },
};
