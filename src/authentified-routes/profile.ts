import type {  FastifyInstance,  FastifyRequest,  FastifyReply, RegisterOptions } from 'fastify';

export default function wishlist(fastify: FastifyInstance, opts: RegisterOptions, next: (err?: Error) => void): void {
  // Get Profile info
  fastify.route({
    url: '/',
    method: 'GET',
    schema: {
      description: 'Get profile infos',
      tags: ['authenticated']
    },
    handler: async function (req: FastifyRequest, reply: FastifyReply) {
      const u = await fastify.dynamooseModels.users.get({ discordId: req.session.discordId });
      return reply.send(u);
    }
  });
  // update Profile info
  fastify.route({
    url: '/',
    method: 'PUT',
    schema: {
      description: 'Update profile infos',
      tags: ['authenticated']
    },
    handler: async function (
      req: FastifyRequest<{ Body: { social: Record<string, string>; config: Record<string, string> } }>,
      reply: FastifyReply
    ) {
      await fastify.dynamooseModels.users.update(
        {
          discordId: req.session.discordId
        },
        {
          social: req.body.social,
          config: req.body.config
        }
      );
      return reply.send({ msg: 'ok' });
    }
  });
  next();
}
