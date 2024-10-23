import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import bodyParser from "body-parser";
import admin from "firebase-admin";
import * as serviceAccount from "../serviceAccount.json";
import { userTypeDefs } from "./graphql/typeDefs/userTypes";
import { userResolvers } from "./graphql/resolvers/userResolvers";
import { messageTypeDefs } from "./graphql/typeDefs/messageTypes";
import { messageResolvers } from "./graphql/resolvers/messageResolver";
import { mapDataResolver } from "./graphql/resolvers/mapDataResolver";
import { mapDataTypeDefs } from "./graphql/typeDefs/mapDataTypes";
import { groupMessageResolvers } from "./graphql/resolvers/groupMessagesResolvers";
import { groupMessageTypeDefs } from "./graphql/typeDefs/groupMessagesTypeDefs";
import { groupResolvers } from "./graphql/resolvers/groupsResolvers";
import { groupTypeDefs } from "./graphql/typeDefs/groupsTypeDef";
import { vehicleResolvers } from "./graphql/resolvers/vehicleResolvers";
import { vehicleTypeDefs } from "./graphql/typeDefs/vehicleTypeDefs";
import { childResolvers } from "./graphql/resolvers/childrenResolvers";
import { childTypeDefs } from "./graphql/typeDefs/childrenTypeDefs";
import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import { IResolvers } from "@graphql-tools/utils";
import session from "express-session";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

const typeDefs = mergeTypeDefs([
  userTypeDefs,
  messageTypeDefs,
  mapDataTypeDefs,
  groupMessageTypeDefs,
  groupTypeDefs,
  vehicleTypeDefs,
  childTypeDefs,
]);

const resolvers: IResolvers = mergeResolvers([
  userResolvers,
  messageResolvers,
  mapDataResolver,
  groupMessageResolvers,
  groupResolvers,
  vehicleResolvers,
  childResolvers,
]);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(cors({ origin: "*" }));

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/subscriptions",
  });

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const serverCleanup = useServer(
    {
      schema,
      onConnect: () => {
        console.log("Client connected to WebSocket");
      },
      onDisconnect: () => {
        console.log("Client disconnected from WebSocket");
      },
    },
    wsServer
  );

  app.use(
    session({
      secret: "fullstack-bcit-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24,
      },
    })
  );

  interface MyContext {
    req: express.Request;
    res: express.Response;
    currentUser: admin.auth.DecodedIdToken | null;
    sessionData: session.Session;
  }

  const server = new ApolloServer<MyContext>({
    schema,
    formatError: (err) => {
      console.error(err);
      return err;
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              console.log("Draining HTTP server...");
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use(
    "/graphql",
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req, res }): Promise<MyContext> => {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ")
          ? authHeader.split("Bearer ")[1]
          : null;

        let currentUser = null;
        if (token) {
          try {
            currentUser = await admin.auth().verifyIdToken(token);
          } catch (error) {
            console.error("Error verifying token:", error);
          }
        }

        return {
          req,
          res,
          currentUser,
          sessionData: req.session as session.Session,
        };
      },
    })
  );

  httpServer.listen(4000, () => {
    console.log("Server is running on http://localhost:4000/graphql");
  });
}

startServer();
