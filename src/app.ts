import fastify from 'fastify';
import fastifyCORS from 'fastify-cors';
import fastifyEnv from 'fastify-env';
import { readFileSync } from 'fs';
import { join } from 'path';
import fastifySecureSession from 'fastify-secure-session';
import pino from 'pino';
import { PrismaClient } from '@prisma/client';

import authRoute from './routes/auth';

import type { FastifyRequest, FastifyReply } from 'fastify';

const GIT_REV = process.env.GIT_REVISION;
const logger = pino().child({ revision: GIT_REV });
const app = fastify({ logger, exposeHeadRoutes: true });

const envSchema = {
  type: 'object',
  required: ['DISCORD_CLIENT_ID', 'DISCORD_SECRET', 'DATABASE_URL', 'GIT_REVISION', 'COOKIE_KEY'],
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
};

const prisma = new PrismaClient();
app.decorate('prisma', prisma);

app.register(fastifyEnv, { schema: envSchema, dotenv: true });
app.register(fastifySecureSession, {
  key: Buffer.from(process.env.COOKIE_KEY, 'hex'),
  cookie: {
    path: '/',
    httpOnly: true
  }
});
app.register(fastifyCORS, { origin: true, methods: 'GET,POST' });
app.register(authRoute, { prefix: 'auth' });

app.get('/info', async function (_: FastifyRequest, reply: FastifyReply) {
  return reply.send({ keycap: 'archivist', app: 'general', revision: app['config'].GIT_REVISION });
});

if (require.main === module) {
  app.listen(3000, '0.0.0.0', (err) => {
    if (err) console.error(err);
  });
}

export default app;
