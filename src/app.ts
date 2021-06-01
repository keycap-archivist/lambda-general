import fastify from 'fastify';
import fastifyCORS from 'fastify-cors';
import fastifyEnv from 'fastify-env';
import fastifyCaching from 'fastify-caching';
import fastifySession from 'fastify-server-session';
import fastifyCookie from 'fastify-cookie';
import IORedis from 'ioredis';
import pino from 'pino';
import { PrismaClient } from '@prisma/client';
import AbCache from 'abstract-cache';

// routes
import authRoute from './routes/auth';
import miscRoutes from './routes/misc';
import authenticatedRoutes from './authentified-routes/index';

import type { OAuth2Namespace } from 'fastify-oauth2';

const GIT_REV = process.env.GIT_REVISION;
const logger = pino().child({ revision: GIT_REV });
const app = fastify({ logger, exposeHeadRoutes: true });
const redisClient = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});
const prisma = new PrismaClient();
const abache = AbCache({
  driver: {
    name: 'abstract-cache-redis',
    options: { client: redisClient }
  }
});
app.decorate('prisma', prisma);

app
  .register(fastifyEnv, {
    schema: {
      type: 'object',
      required: [
        'DISCORD_CLIENT_ID',
        'DISCORD_SECRET',
        'DATABASE_URL',
        'GIT_REVISION',
        'COOKIE_KEY',
        'REDIS_HOST',
        'REDIS_PORT'
      ],
      properties: {
        COOKIE_KEY: { type: 'string' },
        GIT_REVISION: { type: 'string' },
        DATABASE_URL: { type: 'string' },
        BASE_URL: { type: 'string' },
        DISCORD_CLIENT_ID: { type: 'string' },
        DISCORD_SECRET: { type: 'string' },
        DISCORD_PERMISSION: { type: 'string' }
      }
    },
    dotenv: true
  })
  .register(fastifyCookie)
  .register(fastifyCaching, {
    expiresIn: 50,
    cache: abache,
    cacheSegment: 'fastifyCache'
  })
  .register(fastifySession, {
    sessionCookieName: 'KA-SESSION',
    secretKey: process.env.COOKIE_KEY,
    sessionMaxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    cookie: { path: '/', httpOnly: true, sameSite: process.env.NODE_ENV === 'production' }
  })
  .register(fastifyCORS, { origin: true, methods: 'GET,POST' });

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
    prisma: PrismaClient;
    discordOAuth2: OAuth2Namespace;
    config: {
      GIT_REVISION: string;
      DISCORD_CLIENT_ID: string;
      DISCORD_SECRET: string;
      BASE_URL: string;
    };
  }
  interface FastifyRequest {
    session: {
      discordId?: string;
      dbId?: number;
    };
  }
}
