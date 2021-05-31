import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default function misc(fastify: FastifyInstance, opts, next): void {
  fastify.get(
    '/info',
    {
      schema: {
        description: 'API info'
      }
    },
    async function (req: FastifyRequest, reply: FastifyReply) {
      return reply.send({ keycap: 'archivist', app: 'general', revision: fastify.GIT_REV });
    }
  );

  next();
}
