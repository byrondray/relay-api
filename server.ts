import express from 'express';
import { ApolloServer, BaseContext } from '@apollo/server';
import { Request, Response } from 'express';
import { expressMiddleware } from '@apollo/server/express4';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import * as serviceAccount from './serviceAccount.json';
import { userTypeDefs } from './graphql/typeDefs/userTypes';
import { userResolvers } from './graphql/resolvers/userResolvers';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import session, { Session } from 'express-session';

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

  app.use(
    session({
      secret: 'fullstack-bcit-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24,
      },
    })
  );

  interface MyContext extends BaseContext {
    req: Request;
    res: Response;
    currentUser: admin.auth.DecodedIdToken | null;
    sessionData: Session;
  }

  const server = new ApolloServer<MyContext>({
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
    expressMiddleware<MyContext>(server, {
      context: async ({ req, res }) => {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ')
          ? authHeader.split('Bearer ')[1]
          : null;

        console.log('Received Token:', token);

        let currentUser = null;
        if (token) {
          try {
            currentUser = await admin.auth().verifyIdToken(token);
            console.log('Decoded Token:', currentUser);
          } catch (error) {
            console.error('Error verifying token:', (error as Error).message);
          }
        } else {
          console.log('No valid token found');
        }

        const sessionData = req.session;

        return { req, res, currentUser, sessionData };
      },
    })
  );

  app.listen(4000, () => {
    console.log('Server is running on http://localhost:4000/graphql');
  });
}

startServer();
