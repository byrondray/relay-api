import { ApolloError } from "apollo-server-errors";
import { getDB } from "../../database/client";
import { eq, and, or } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { FirebaseUser } from "./userResolvers";
import { users } from "../../database/schema/users";
import { friends } from "../../database/schema/friends";
import { ad } from "@faker-js/faker/dist/airline-C5Qwd7_q";

const db = getDB();

export const friendsResolvers = {
  Query: {
    getFriends: async (_: any, __: any, { currentUser }: FirebaseUser) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const friendsResult = await db
        .select({
          id: friends.id,
          userId: friends.userId,
          createdAt: friends.createdAt,
          friends: users,
        })
        .from(friends)
        .where(eq(friends.userId, currentUser.uid))
        .leftJoin(users, eq(users.id, friends.friendId));

      console.log(friendsResult);

      return friendsResult;
    },

    getFriend: async (
      _: any,
      { friendId }: { friendId: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const friendResult = await db
        .select({
          id: friends.id,
          userId: friends.userId,
          createdAt: friends.createdAt,
          friends: users,
        })
        .from(friends)
        .where(eq(friends.friendId, friendId))
        .leftJoin(users, eq(users.id, friends.userId));

      if (friendResult.length === 0) {
        throw new ApolloError("You got no friends :(");
      }

      return friendResult[0];
    },
  },
  Mutation: {
    addFriend: async (
      _: any,
      { friendId }: { friendId: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const friend = await db
        .select()
        .from(users)
        .where(eq(users.id, friendId));

      if (friend.length === 0) {
        throw new ApolloError("User not found");
      }

      const friendsExist = await db
        .select()
        .from(friends)
        .where(
          and(
            eq(friends.userId, currentUser.uid),
            eq(friends.friendId, friendId)
          )
        );

      if (friendsExist.length > 0) {
        throw new ApolloError("Cannot friend the same person twice");
      }

      const result = await db.insert(friends).values([
        {
          id: uuid(),
          userId: currentUser.uid,
          friendId,
          createdAt: new Date().toISOString(),
        },
        {
          id: uuid(),
          userId: friendId,
          friendId: currentUser.uid,
          createdAt: new Date().toISOString(),
        },
      ]);

      if (result) {
        return { message: "Friend added successfully" };
      }

      throw new ApolloError("Failed to add friend");
    },
    deleteFriend: async (
      _: any,
      { friendId }: { friendId: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const existingFriend = await db
        .select()
        .from(friends)
        .where(
          and(
            eq(friends.userId, currentUser.uid),
            eq(friends.friendId, friendId)
          )
        );
      if (existingFriend.length === 0) {
        throw new ApolloError("Friend not found");
      }

      const result = await db
        .delete(friends)
        .where(
          and(
            or(
              and(
                eq(friends.userId, currentUser.uid),
                eq(friends.friendId, friendId)
              ),
              and(
                eq(friends.userId, friendId),
                eq(friends.friendId, currentUser.uid)
              )
            )
          )
        );

      if (result) {
        return { message: "Friend removed successfully" };
      }

      throw new ApolloError("Failed to remove friend");
    },
  },
};
