import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { gql } from 'graphql-tag';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';

let users = [
  { id: uuidv4(), name: 'John Doe', email: 'john@example.com' },
  { id: uuidv4(), name: 'Jane Doe', email: 'jane@example.com' },
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
    createUser(name: String!, email: String!): User!
  }
`;

const resolvers = {
  Query: {
    getUser: (_: any, { id }: { id: string }) => {
      console.log(`Fetching user with ID: ${id}`);
      return users.find((user) => user.id == id);
    },
    getUsers: () => {
      console.log('Fetching all users');
      return users;
    },
  },
  Mutation: {
    createUser: (_: any, { name, email }: { name: string; email: string }) => {
      // Run the Firebase logic here (if any)

      const newUser = { id: uuidv4(), name, email };
      users.push(newUser);

      console.log(`Creating user with name: ${name} and email: ${email}`);
      console.log(users);

      return newUser;
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

  app.use('/graphql', bodyParser.json(), expressMiddleware(server));

  app.listen(4000, () => {
    console.log('Server is running on http://localhost:4000/graphql');
  });
}

startServer();
