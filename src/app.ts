import fastify from 'fastify';
import fastifyCORS from 'fastify-cors';
import fastifyEnv from 'fastify-env';
import fastifySession from '@mgcrea/fastify-session';
import RedisStore from '@mgcrea/fastify-session-redis-store';
import fastifyCookie from 'fastify-cookie';
import Redis from 'ioredis';
import pino from 'pino';
import { PrismaClient } from '@prisma/client';

import authRoute from './routes/auth';

import type { FastifyRequest, FastifyReply } from 'fastify';

const GIT_REV = process.env.GIT_REVISION;
const logger = pino().child({ revision: GIT_REV });
const app = fastify({ logger, exposeHeadRoutes: true });
const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});
const prisma = new PrismaClient();

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
        PORT: { type: 'integer', default: 3000 },
        DISCORD_CLIENT_ID: { type: 'string' },
        DISCORD_SECRET: { type: 'string' },
        DISCORD_PERMISSION: { type: 'string' }
      }
    },
    dotenv: true
  })
  .register(fastifyCookie)
  .register(fastifySession, {
    cookieName: 'KA-SESSION',
    secret: process.env.COOKIE_KEY,
    cookie: { path: '/' },
    store: new RedisStore({ client: redisClient })
  })
  .register(fastifyCORS, { origin: true, methods: 'GET,POST' });

app.register(authRoute, { prefix: 'auth' });

app.get('/info', async function (req: FastifyRequest, reply: FastifyReply) {
  req.session.set('foo', 'bar');
  return reply.send({ keycap: 'archivist', app: 'general', revision: app['config'].GIT_REVISION });
});

if (require.main === module) {
  app.listen(3000, '0.0.0.0', (err) => {
    if (err) console.error(err);
  });
}

export default app;
