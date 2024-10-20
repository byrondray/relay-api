import {
  ApolloError,
  AuthenticationError,
  UserInputError,
} from "apollo-server-errors";
import {
  createUser as createUserInDB,
  findUserByEmail,
  findUserById,
  getUsers,
  updateExpoPushToken,
} from "../../services/user.service";
import { Request } from "express";

declare module "express-session" {
  interface Session {
    userId?: string;
  }
}

export const userResolvers = {
  Query: {
    getUser: async (_: any, { id }: { id: string }, { currentUser }: any) => {
      if (!currentUser) {
        throw new AuthenticationError("Authentication required");
      }

      try {
        const userArray = await findUserById(id);
        const user = userArray[0];

        const name = `${user.firstName} ${user.lastName || ""}`.trim();

        if (!user) {
          return;
        }

        return {
          id: user.id,
          name,
          email: user.email,
        };
      } catch (error) {
        console.error(`Error fetching user: ${error}`);
        throw new ApolloError("Internal server error");
      }
    },
    getUsers: async (_: any, __: any, { currentUser }: any) => {
      if (!currentUser) {
        throw new AuthenticationError("Authentication required");
      }

      const users = await getUsers();

      return users.map((user: any) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName || ""}`.trim(),
        email: user.email,
      }));
    },
  },
  Mutation: {
    createUser: async (
      _: any,
      {
        name,
        email,
        firebaseId,
        expoPushToken,
      }: {
        name: string;
        email: string;
        firebaseId: string;
        expoPushToken: string;
      },
      { req }: { req: Request }
    ) => {
      if (!name || !email || !firebaseId) {
        throw new UserInputError("Invalid input", {
          code: "INVALID_INPUT",
        });
      }

      try {
        let userRecord = await findUserByEmail(email);

        if (userRecord.length === 0) {
          const [firstName, ...lastNameParts] = name.split(" ");
          const lastName = lastNameParts.join(" ");

          userRecord = await createUserInDB({
            id: firebaseId,
            firstName,
            lastName,
            email: email.toLowerCase(),
            createdAt: new Date().toISOString(),
            expoPushToken,
          });
        } else {
          await updateExpoPushToken(userRecord[0].id, expoPushToken);
        }

        req.session.userId = userRecord[0].id;

        return {
          id: userRecord[0].id,
          name: `${userRecord[0].firstName} ${
            userRecord[0].lastName || ""
          }`.trim(),
          email: userRecord[0].email,
          sessionId: req.session.userId,
        };
      } catch (error: any) {
        console.error("Error syncing user with DB:", error);

        throw new ApolloError("Failed to sync user", "INTERNAL_SERVER_ERROR", {
          details: error.message,
        });
      }
    },

    login: async (
      _: any,
      {
        email,
        firebaseId,
        expoPushToken,
      }: { email: string; firebaseId: string; expoPushToken: string },
      { req }: { req: Request }
    ) => {
      try {
        let userRecord = await findUserByEmail(email.toLowerCase());

        console.log("User record:", userRecord);

        if (userRecord.length === 0 || !userRecord[0].id) {
          const userById = await findUserById(firebaseId);
          if (userById.length > 0) {
            throw new Error(
              `User with Firebase ID ${firebaseId} already exists.`
            );
          }

          const firstName = email.split("@")[0];
          userRecord = await createUserInDB({
            id: firebaseId,
            firstName,
            email,
            expoPushToken,
          });
        } else {
          await updateExpoPushToken(userRecord[0].id, expoPushToken);
        }

        req.session.userId = userRecord[0].id;

        return {
          id: userRecord[0].id,
          name: `${userRecord[0].firstName} ${
            userRecord[0].lastName || ""
          }`.trim(),
          email: userRecord[0].email,
          sessionId: req.session.userId,
        };
      } catch (error: any) {
        console.error("Error during login:", error);
        throw new ApolloError("Failed to log in", "INTERNAL_SERVER_ERROR", {
          details: error.message,
        });
      }
    },
    updateExpoPushToken: async (
      _: any,
      { userId, expoPushToken }: { userId: string; expoPushToken: string },
      { currentUser }: any
    ) => {
      if (!currentUser) {
        throw new AuthenticationError("Authentication required");
      }

      try {
        const updatedUser = await updateExpoPushToken(userId, expoPushToken);

        if (!updatedUser || updatedUser.length === 0) {
          throw new ApolloError("Failed to update Expo Push Token");
        }

        return {
          id: updatedUser[0].id,
          name: `${updatedUser[0].firstName} ${
            updatedUser[0].lastName || ""
          }`.trim(),
          email: updatedUser[0].email,
          expoPushToken: updatedUser[0].expoPushToken,
        };
      } catch (error) {
        console.error("Error updating Expo Push Token:", error);
        throw new ApolloError(
          "Failed to update Expo Push Token",
          "INTERNAL_SERVER_ERROR",
          {
            details: (error as Error).message,
          }
        );
      }
    },
  },
};
