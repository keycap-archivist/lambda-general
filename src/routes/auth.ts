import oauth2 from 'fastify-oauth2';
import got from 'got';

import { userStatus } from '../internal/enums';

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { OAuth2Token } from 'fastify-oauth2';

export default function auth(fastify: FastifyInstance, opts, next): void {
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
    const user = await fastify.prisma.user.count({
      where: {
        discordId: profile.id
      }
    });
    if (!user) {
      request.log.info(`Creating new user ${profile.name} ${profile.id}`);
      await fastify.prisma.user.create({
        data: {
          name: profile.username,
          discordId: profile.id,
          avatar: profile.avatar,
          locale: profile.locale,
          status: userStatus.active
        }
      });
    }
    request.session.discordId = profile.id;
    return reply.send('ok');
  });

  fastify.get('/logout', async function (req: FastifyRequest, reply: FastifyReply) {
    req.session = {};
    return reply.code(200).send('ok');
  });

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
