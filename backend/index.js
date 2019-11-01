const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const { PubSub } = require('graphql-subscriptions');
const cors = require('cors');
const { execute, subscribe } = require('graphql');
const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');

const pubsub = new PubSub();
const NOTIFICATION_SUBSCRIPTION_TOPIC = 'newMessages';

const messages = [];
const users = [
  {
    id:1,
    name:"Payu",
  },
  {
    id:2,
    name:"Alpa",
  }
];
const typeDefs = `
  type Query { messages: [Message], users:[User] }
  type User { id: ID, name: String }
  type Message { content: String, user_id_from: ID, user_id_to: ID, created_at: String }
  type Mutation { pushMessage(content: String!, user_id_from: ID, user_id_to: ID, created_at: String): Message }
  type Subscription { newMessage: Message }
`;
const resolvers = {
  Query: { messages: () => messages, users: () => users },
  Mutation: {
      pushMessage: (root, args) => {
        const newMessage = { content: args.content, user_id_from: args.user_id_from, user_id_to: args.user_id_to, created_at: args.created_at };
        messages.push(newMessage);
        pubsub.publish(NOTIFICATION_SUBSCRIPTION_TOPIC, { newMessage: newMessage });

        return newMessage;
      },
  },
  Subscription: {
    newMessage: {
      subscribe: () => pubsub.asyncIterator(NOTIFICATION_SUBSCRIPTION_TOPIC)
    }
  },
};
const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
app.use('*', cors({ origin: `http://localhost:3000` }));
app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
app.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql',
  subscriptionsEndpoint: `ws://localhost:4000/subscriptions`
}));
const ws = createServer(app);
ws.listen(4000, () => {
  console.log('Go to http://localhost:4000/graphiql to run queries!');

  new SubscriptionServer({
    execute,
    subscribe,
    schema
  }, {
    server: ws,
    path: '/subscriptions',
  });
});
