import fastify from 'fastify';
import fastifyCORS from 'fastify-cors';
import fastifyEnv from 'fastify-env';
import fastifyCaching from 'fastify-caching';
import fastifySession from 'fastify-server-session';
import fastifyCookie from 'fastify-cookie';
import pino from 'pino';
// import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import AbCache from 'abstract-cache';
import * as dynamoose from 'dynamoose';

import dynamoCache from './dynamo-cache';
import { models } from './internal/dynamo';

// routes
import authRoute from './routes/auth';
import miscRoutes from './routes/misc';
import authenticatedRoutes from './authentified-routes/index';

import type { OAuth2Namespace } from 'fastify-oauth2';

const GIT_REV = process.env.GIT_REVISION;
const logger = pino().child({ revision: GIT_REV });
const app = fastify({ logger, exposeHeadRoutes: true });
const TTL_SESSION = 1000 * 60 * 60 * 24 * 7; // 1 week

let ddb;
if (process.env.NODE_ENV !== 'production') {
  ddb = new dynamoose.aws.sdk.DynamoDB({
    accessKeyId: 'AKID',
    secretAccessKey: 'SECRET',
    region: 'us-east-2',
    endpoint: 'http://localhost:8500'
  });
} else {
  ddb = new dynamoose.aws.sdk.DynamoDB();
}

// Set DynamoDB instance to the Dynamoose DDB instance
dynamoose.aws.ddb.set(ddb);

const dynamooseModels = models(TTL_SESSION);

const abache = AbCache({
  useAwait: false,
  client: dynamoCache({ model: dynamooseModels.sessions })
});
app.decorate('dynamoose', dynamoose);
app.decorate('dynamooseModels', dynamooseModels);
app
  .register(fastifyEnv, {
    schema: {
      type: 'object',
      required: ['DISCORD_CLIENT_ID', 'DISCORD_SECRET', 'GIT_REVISION', 'COOKIE_KEY', 'REDIRECT_LOGIN_URL'],
      properties: {
        COOKIE_KEY: { type: 'string' },
        GIT_REVISION: { type: 'string' },
        BASE_URL: { type: 'string' },
        DISCORD_CLIENT_ID: { type: 'string' },
        DISCORD_SECRET: { type: 'string' },
        REDIRECT_LOGIN_URL: { type: 'string' }
      }
    },
    dotenv: true
  })
  .register(fastifyCookie)
  .register(fastifyCaching, {
    cache: abache
  })
  .register(fastifySession, {
    sessionCookieName: 'KA-SESSION',
    secretKey: process.env.COOKIE_KEY,
    sessionMaxAge: TTL_SESSION,
    cookie: { expires: TTL_SESSION, path: '/', httpOnly: true, sameSite: 'None', secure: true }
  })
  .register(fastifyCORS, {
    origin: ['https://api.keycap-archivist.com', 'http://localhost:8000'],
    methods: 'GET,POST,DELETE',
    credentials: true
  });

// Non authenticated routes
app.register(authRoute, { prefix: 'auth' });
app.register(miscRoutes);

// authenticated routes
app.register(authenticatedRoutes);

if (require.main === module) {
  app.listen(3001, '0.0.0.0', (err) => {
    if (err) console.error(err);
  });
}

export default app;

declare module 'fastify' {
  interface FastifyInstance {
    dynamoDb: any;
    dynamooseModels: {
      users: any;
      wishlists: any;
      sessions: any;
    };
    discordOAuth2: OAuth2Namespace;
    config: {
      GIT_REVISION: string;
      DISCORD_CLIENT_ID: string;
      DISCORD_SECRET: string;
      BASE_URL: string;
      REDIRECT_LOGIN_URL: string;
    };
  }
  interface FastifyRequest {
    session: {
      name?: string;
      avatar?: string;
      discordId?: string;
      dbId?: number;
      touched?: boolean;
    };
  }
}
