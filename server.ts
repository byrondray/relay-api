import express from 'express';
import { ApolloServer, BaseContext } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import * as serviceAccount from './serviceAccount.json';
import { userTypeDefs } from './graphql/typeDefs/userTypes';
import { userResolvers } from './graphql/resolvers/userResolvers';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';

const typeDefs = mergeTypeDefs([userTypeDefs]);
const resolvers = mergeResolvers([userResolvers]);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export let users = [
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

async function startServer() {
  const app = express();

  const server = new ApolloServer<BaseContext>({
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
    expressMiddleware<BaseContext>(server, {
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
