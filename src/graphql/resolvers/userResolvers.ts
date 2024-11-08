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
import { getDB } from "../../database/client";
import { UserInsert, users } from "../../database/schema/users";
import { eq } from "drizzle-orm";

const db = getDB();

declare module "express-session" {
  interface Session {
    userId?: string;
  }
}

export type FirebaseUser = {
  currentUser: {
    iss: string;
    aud: string;
    auth_time: number;
    user_id: string;
    sub: string;
    iat: number;
    exp: number;
    email: string;
    email_verified: boolean;
    firebase: {
      identities: {
        email: string[];
      };
      sign_in_provider: string;
    };
    uid: string;
  };
};

export const userResolvers = {
  Query: {
    getUser: async (
      _: any,
      { id }: { id: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new AuthenticationError("Authentication required");
      }

      try {
        const userArray = await findUserById(id);
        const user = userArray[0];

        if (!user) {
          return;
        }

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          insuranceImageUrl: user.insuranceImageUrl,
          licenseImageUrl: user.licenseImageUrl,
          imageUrl: user.imageUrl,
          city: user.city,
          email: user.email,
        };
      } catch (error) {
        console.error(`Error fetching user: ${error}`);
        throw new ApolloError("Internal server error");
      }
    },
    getUsers: async (_: any, __: any, { currentUser }: FirebaseUser) => {
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
    hasUserOnBoarded: async (
      _: any,
      __: any,
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new AuthenticationError("Authentication required");
      }
      try {
        // const result = await db
        //   .select()
        //   .from(users)
        //   .where(eq(users.id, currentUser.uid))
        //   .innerJoin(children, eq(users.id, children.userId));

        // const user = await db
        //   .select()
        //   .from(users)
        //   .where(
        //     and(
        //       eq(users.id, currentUser.uid),
        //       notLike(users.city, ""),
        //       notLike(users.lastName, "")
        //     )
        //   );

        // if (user.length === 0) {
        //   return false;
        // }

        // return result.length > 0;

        if (currentUser.uid === "wcBP7eHQU3XDOnkjtWQpt6qYb9z2") return false;
        return true;
      } catch (error) {
        console.error(`Error fetching user: ${error}`);
        throw new ApolloError("Internal server error");
      }
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
        let userRecord = await findUserByEmail(email.toLowerCase());

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
          firstName: userRecord[0].firstName ?? "",
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
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new AuthenticationError("Authentication required");
      }

      try {
        const updatedUser = await updateExpoPushToken(userId, expoPushToken);

        if (!updatedUser) {
          throw new ApolloError("Failed to update Expo Push Token");
        }

        return {
          id: updatedUser[0].id,
          firstName: updatedUser[0].firstName,
          lastName: updatedUser[0]?.lastName ?? "",
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

    updateUserInfo: async (
      _: any,
      {
        id,
        firstName,
        lastName,
        email,
        phoneNumber,
        city,
        imageUrl,
        insuranceImageUrl,
        licenseImageUrl,
      }: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        city: string;
        imageUrl?: string;
        insuranceImageUrl?: string;
        licenseImageUrl?: string;
      },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new AuthenticationError("Authentication required");
      }

      const updates: Partial<Record<string, any>> = {};

      if (!phoneNumber) {
        throw new UserInputError("Phone number must be provided");
      }

      if (!city) {
        throw new UserInputError("City must be provided");
      }

      if (!lastName) {
        throw new UserInputError("Last name must be provided");
      }

      if (typeof firstName === "string" && firstName.trim())
        updates.firstName = firstName;
      if (typeof lastName === "string" && lastName.trim())
        updates.lastName = lastName;
      if (typeof email === "string" && email.trim()) updates.email = email;
      if (typeof phoneNumber === "string" && phoneNumber.trim())
        updates.phoneNumber = phoneNumber;
      if (typeof city === "string" && city.trim()) updates.city = city;
      if (typeof licenseImageUrl === "string" && licenseImageUrl.trim())
        updates.insurancelicenseImageUrl = licenseImageUrl;
      if (typeof insuranceImageUrl === "string" && insuranceImageUrl.trim())
        updates.insuranceImageUrl = insuranceImageUrl;
      if (typeof imageUrl === "string" && imageUrl.trim())
        updates.imageUrl = imageUrl;

      if (Object.keys(updates).length === 0) {
        throw new ApolloError("No valid fields provided for update");
      }

      try {
        const updatedUsers: UserInsert[] = await db
          .update(users)
          .set(updates)
          .where(eq(users.id, id))
          .returning();

        const updatedUser = updatedUsers[0];

        if (!updatedUser) {
          throw new ApolloError("Failed to update user info");
        }

        return {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          phone_number: updatedUser.phoneNumber,
          imageUrl: updatedUser.imageUrl,
          licenseImageUrl: updatedUser.licenseImageUrl,
          insuranceImageUrl: updatedUser.insuranceImageUrl,
          city: updatedUser.city,
        };
      } catch (error) {
        console.error("Error updating user info:", error);
        throw new ApolloError(
          "Failed to update user info",
          "INTERNAL_SERVER_ERROR",
          {
            details: (error as Error).message,
          }
        );
      }
    },
  },
};
