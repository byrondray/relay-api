import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { gql } from 'graphql-tag';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import * as serviceAccount from './serviceAccount.json';

console.log(serviceAccount, 'serviceAccount');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

let users = [
  {
    id: uuidv4(),
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password',
  },
  {
    id: uuidv4(),
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password',
  },
];

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Query {
    getUser(id: ID!): User
    getUsers: [User!]!
  }

  type Mutation {
    createUser(name: String!, email: String!, password: String!): User!
  }
`;

const resolvers = {
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

        // Example: Add the user to an array
        users.push(newUser);

        return newUser;
      } catch (error) {
        console.error('Error creating Firebase user:', error);
        throw new Error('Failed to create user');
      }
    },
  },
};

async function startServer() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (err) => {
      console.error(err);
      return err;
    },
  });

  await server.start();

  app.use(
    '/graphql',
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ')
          ? authHeader.split('Bearer ')[1]
          : null;

        let currentUser = null;
        if (token) {
          try {
            currentUser = await admin.auth().verifyIdToken(token);
          } catch (error) {
            console.error('Error verifying token:', error);
          }
        }

        return { currentUser };
      },
    })
  );

  app.listen(4000, () => {
    console.log('Server is running on http://localhost:4000/graphql');
  });
}

startServer();
