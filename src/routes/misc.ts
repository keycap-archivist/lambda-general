import type { FastifyInstance, FastifyRequest, FastifyReply, RegisterOptions } from 'fastify';

export default function misc(fastify: FastifyInstance, opts: RegisterOptions, next: (err?: Error) => void): void {
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
