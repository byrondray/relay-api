import { ApolloError } from "apollo-server-errors";
import { getDB } from "../../database/client";
import { ChildInsert, children } from "../../database/schema/children";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { schools } from "../../database/schema/schools";
import { type FirebaseUser } from "./userResolvers";

const db = getDB();

export const childResolvers = {
  Query: {
    getChild: async (
      _: any,
      { id }: { id: string },
      { currentUser }: FirebaseUser
    ) => {
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

    getChildren: async (_: any, __: any, { currentUser }: FirebaseUser) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const result = await db.select().from(children);
      return result;
    },

    getChildrenForUser: async (
      _: any,
      __: any,
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const result = await db
        .select()
        .from(children)
        .where(eq(children.userId, currentUser.uid));
      console.log("result", result);
      return result;
    },
  },

  Mutation: {
    createChild: async (
      _: any,
      {
        firstName,
        schoolName,
        schoolEmailAddress,
        imageUrl,
      }: {
        firstName: string;
        schoolName: string;
        schoolEmailAddress: string;
        imageUrl: string;
      },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const school = await db
        .select()
        .from(schools)
        .where(eq(schools.name, schoolName));

      if (school.length === 0) {
        throw new ApolloError("School not found");
      }

      const childData: ChildInsert = {
        id: uuid(),
        userId: currentUser.uid,
        firstName,
        schoolId: school[0].id,
        schoolEmailAddress,
        imageUrl,
        createdAt: new Date().toISOString(),
      };

      console.log("childData", childData);

      const result = await db.insert(children).values(childData);

      if (result) {
        return childData;
      }
    },
  },
};
