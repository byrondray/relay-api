import {
  ApolloError,
  AuthenticationError,
  UserInputError,
} from 'apollo-server-errors';
import {
  createUser as createUserInDB,
  findUserByEmail,
  findUserById,
  getUsers,
  updateExpoPushToken,
} from '../../services/user.service';
import { Request } from 'express';

declare module 'express-session' {
  interface Session {
    userId?: string;
  }
}

export const userResolvers = {
  Query: {
    getUser: async (_: any, { id }: { id: string }, { currentUser }: any) => {
      if (!currentUser) {
        throw new AuthenticationError('Authentication required');
      }

      console.log(`Fetching user with ID: ${id}`);
      try {
        const userArray = await findUserById(id);
        const user = userArray[0];

        if (!user) {
          throw new UserInputError(`User with ID ${id} not found.`);
        }

        const name = `${user.firstName} ${user.lastName || ''}`.trim();

        return {
          id: user.id,
          name,
          email: user.email,
        };
      } catch (error) {
        console.error(`Error fetching user: ${error}`);
        throw new ApolloError('Internal server error');
      }
    },
    getUsers: async (_: any, __: any, { currentUser }: any) => {
      if (!currentUser) {
        throw new AuthenticationError('Authentication required');
      }

      console.log('Fetching all users');
      const users = await getUsers();

      return users.map((user: any) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
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
        throw new UserInputError('Invalid input', {
          code: 'INVALID_INPUT',
        });
      }

      try {
        let userRecord = await findUserByEmail(email);

        if (userRecord.length === 0) {
          const [firstName, ...lastNameParts] = name.split(' ');
          const lastName = lastNameParts.join(' ');

          userRecord = await createUserInDB({
            id: firebaseId,
            firstName,
            lastName,
            email: email.toLowerCase(),
            createdAt: new Date().toISOString(),
            expoPushToken,
          });

          console.log('Successfully added user to DB:', firebaseId);
        } else {
          console.log('User already exists in DB:', userRecord[0].id);

          await updateExpoPushToken(userRecord[0].id, expoPushToken);
        }

        req.session.userId = userRecord[0].id;

        return {
          id: userRecord[0].id,
          name: `${userRecord[0].firstName} ${
            userRecord[0].lastName || ''
          }`.trim(),
          email: userRecord[0].email,
          sessionId: req.session.userId,
        };
      } catch (error: any) {
        console.error('Error syncing user with DB:', error);

        throw new ApolloError('Failed to sync user', 'INTERNAL_SERVER_ERROR', {
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

        console.log('User record:', userRecord);

        if (userRecord.length === 0 || !userRecord[0].id) {
          const userById = await findUserById(firebaseId);
          if (userById.length > 0) {
            throw new Error(
              `User with Firebase ID ${firebaseId} already exists.`
            );
          }

          const firstName = email.split('@')[0];
          userRecord = await createUserInDB({
            id: firebaseId,
            firstName,
            email,
            expoPushToken,
          });
          console.log('Successfully added user to DB:', firebaseId);
        } else {
          console.log('User already exists in DB:', userRecord[0].id);
          await updateExpoPushToken(userRecord[0].id, expoPushToken);
        }

        req.session.userId = userRecord[0].id;

        return {
          id: userRecord[0].id,
          name: `${userRecord[0].firstName} ${
            userRecord[0].lastName || ''
          }`.trim(),
          email: userRecord[0].email,
          sessionId: req.session.userId,
        };
      } catch (error: any) {
        console.error('Error during login:', error);
        throw new ApolloError('Failed to log in', 'INTERNAL_SERVER_ERROR', {
          details: error.message,
        });
      }
    },
  },
};
