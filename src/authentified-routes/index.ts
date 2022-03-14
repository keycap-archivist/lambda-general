import ws from './wishlist';
import profile from './profile';

import type { FastifyInstance, FastifyRequest, FastifyReply, RegisterOptions } from 'fastify';

export default function authenticatedRoutes(fastify: FastifyInstance,  opts: RegisterOptions, next: (err?: Error) => void): void {
  fastify.addHook('onRequest', function (req: FastifyRequest, reply: FastifyReply, next) {
    if (!req.session.discordId) {
      reply.code(401);
      return next(new Error('Unauthorized'));
    }
    // equivalent of touch()
    req.session.touched = true;
    next();
  });

  fastify.register(ws, { prefix: '/ws' });
  fastify.register(profile, { prefix: '/profile' });

  next();
}
