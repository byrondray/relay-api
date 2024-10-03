import { users } from '../../server';
import admin from 'firebase-admin';
import { ApolloError, UserInputError } from 'apollo-server-errors';
import { createUser as createUserInDB } from '../../services/user.service';

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
        password,
      }: { name: string; email: string; password: string }
    ) => {
      if (!name || !email || !password) {
        throw new UserInputError('Invalid input', {
          code: 'INVALID_INPUT',
        });
      }

      try {
        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: name,
        });

        await createUserInDB({
          id: userRecord.uid,
          firstName: userRecord.displayName as string,
          email: userRecord.email || '',
        });

        return {
          id: userRecord.uid,
          name: userRecord.displayName,
          email: userRecord.email,
        };
      } catch (error: any) {
        console.error('Error creating Firebase user:', error);

        if (error.code === 'auth/email-already-exists') {
          throw new UserInputError(
            'The email address is already in use by another account.',
            {
              code: error.code,
              details: error.message,
            }
          );
        }

        throw new ApolloError(
          'Failed to create user',
          'INTERNAL_SERVER_ERROR',
          {
            details: error.message,
          }
        );
      }
    },
  },
};
