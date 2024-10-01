import { users } from '../../server';
import admin from 'firebase-admin';

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
      try {
        console.log(`Creating user with email: ${email}`);
        const newFirebaseUser = await admin.auth().createUser({
          email,
          password,
          displayName: name,
        });

        console.log('Created Firebase user:', newFirebaseUser.uid);

        const newUser = {
          id: newFirebaseUser.uid,
          name: newFirebaseUser.displayName || name,
          email: newFirebaseUser.email || email,
          password,
        };

        users.push(newUser);

        return newUser;
      } catch (error) {
        console.error('Error creating Firebase user:', error);
        throw new Error('Failed to create user');
      }
    },
  },
};
