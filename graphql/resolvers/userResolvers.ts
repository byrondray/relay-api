import { users } from '../../server';
import { ApolloError, UserInputError } from 'apollo-server-errors';
import {
  createUser as createUserInDB,
  findUserByEmail,
} from '../../services/user.service';
import { Request } from 'express';

declare module 'express-session' {
  interface Session {
    userId?: string;
  }
}

export const userResolvers = {
  Query: {
    getUser: (_: any, { id }: { id: string }, { currentUser }: any) => {
      if (!currentUser) {
        throw new Error('Authentication required');
      }

      console.log(`Fetching user with ID: ${id}`);
      return users.find((user) => user.id == id);
    },
    getUsers: (_: any, __: any, { currentUser }: any) => {
      if (!currentUser) {
        throw new Error('Authentication required');
      }

      console.log('Fetching all users');
      return users;
    },
  },
  Mutation: {
    createUser: async (
      _: any,
      {
        name,
        email,
        firebaseId,
      }: { name: string; email: string; firebaseId: string },
      { req }: { req: Request }
    ) => {
      if (!name || !email || !firebaseId) {
        throw new UserInputError('Invalid input', {
          code: 'INVALID_INPUT',
        });
      }

      try {
        let userRecord = await findUserByEmail(email);

        console.log(userRecord, 'userRecord');

        if (userRecord.length === 0) {
          userRecord = await createUserInDB({
            id: firebaseId,
            firstName: name,
            email,
            createdAt: new Date().toISOString(),
          });

          console.log(userRecord, 'userRecord');

          console.log('Successfully added user to DB:', firebaseId);
        } else {
          console.log('User already exists in DB:', userRecord[0].id);
        }

        req.session.userId = userRecord[0].id;

        return {
          id: userRecord[0].id,
          name: userRecord[0].firstName,
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
      { email, firebaseId }: { email: string; firebaseId: string },
      { req }: { req: Request }
    ) => {
      try {
        let userRecord = await findUserByEmail(email);

        if (!userRecord) {
          userRecord = await createUserInDB({
            id: firebaseId,
            firstName: email.split('@')[0],
            email,
          });
          console.log('Successfully added user to DB:', firebaseId);
        } else {
          console.log('User already exists in DB:', userRecord[0].id);
        }

        req.session.userId = userRecord[0].id;

        return {
          id: userRecord[0].id,
          name: userRecord[0].firstName,
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
