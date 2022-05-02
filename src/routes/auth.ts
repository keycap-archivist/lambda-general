import oauth2 from '@fastify/oauth2';
import got from 'got';

import { userStatus } from '../internal/enums';

import type { FastifyInstance, FastifyRequest, FastifyReply, RegisterOptions } from 'fastify';
import type { OAuth2Token } from '@fastify/oauth2';

export default function auth(fastify: FastifyInstance, opts: RegisterOptions, next: (err?: Error) => void): void {
  fastify.register(oauth2, {
    name: 'discordOAuth2',
    credentials: {
      client: {
        id: fastify.config.DISCORD_CLIENT_ID,
        secret: fastify.config.DISCORD_SECRET
      },
      auth: oauth2.DISCORD_CONFIGURATION
    },
    scope: ['identify'],
    startRedirectPath: `/discord`,
    callbackUri: `${fastify.config.BASE_URL}/${opts.prefix || ''}/discord/callback`
  });

  fastify.get('/discord/callback', async function (request: FastifyRequest, reply: FastifyReply) {
    const token = await fastify.discordOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
    request.log.info(token);
    const profile = await getUserProfile(token);
    request.log.info(profile);
    const user = await fastify.dynamooseModels.users.get({ discordId: profile.id });
    if (!user) {
      await fastify.dynamooseModels.users.create({
        name: profile.username,
        discordId: profile.id,
        avatar: profile.avatar,
        locale: profile.locale,
        status: userStatus.active
      });
    }
    request.session.discordId = profile.id;
    request.session.name = profile.username;
    request.session.avatar = profile.avatar;
    return reply.redirect(fastify.config.REDIRECT_LOGIN_URL);
  });

  fastify.get(
    '/current-session',
    {
      schema: {
        description: 'get status of the current session',
        tags: ['authenticated']
      }
    },
    async function (req: FastifyRequest, reply: FastifyReply) {
      req.log.info(`cookies: ${JSON.stringify(req.cookies)}`);
      req.log.info({ ...req.headers });
      if (!req.session.discordId) {
        req.session = {};
        return reply.code(403).send({ msg: 'noop' });
      }
      return reply.code(200).send({
        name: req.session.name,
        avatar: `https://cdn.discordapp.com/avatars/${req.session.discordId}/${req.session.avatar}.png`
      });
    }
  );

  fastify.get(
    '/logout',
    {
      schema: {
        description: 'logout the current session',
        tags: ['authenticated']
      }
    },
    async function (req: FastifyRequest, reply: FastifyReply) {
      req.session = {};
      return reply.code(200).send({ msg: 'ok' });
    }
  );

  next();
}

async function getUserProfile(token: OAuth2Token): Promise<any> {
  const { body } = await got.get('https://discord.com/api/users/@me', {
    responseType: 'json',
    headers: {
      authorization: `${token.token_type} ${token.access_token}`
    }
  });
  return body;
}
