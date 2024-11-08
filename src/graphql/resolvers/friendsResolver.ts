import { ApolloError } from "apollo-server-errors";
import { getDB } from "../../database/client";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { FirebaseUser } from "./userResolvers";
import { users } from "../../database/schema/users";
import { friends } from "../../database/schema/friends";

const db = getDB();

export const friendsResolvers = {
  Query: {
    getFriends: async (_: any, { currentUser }: FirebaseUser) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const friendsResult = await db
        .select({
          id: friends.id,
          userId: friends.userId,
          createdAt: friends.createdAt,
          friends: friends,
        })
        .from(friends)
        .where(eq(friends.userId, currentUser.uid))
        .leftJoin(users, eq(users.id, friends.friendId));

        console.log(friendsResult);

        return friendsResult;
    },
  },
  Mutation: {},
};
