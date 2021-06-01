import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default function misc(fastify: FastifyInstance, opts, next): void {
  fastify.get('/', async function (req: FastifyRequest, reply: FastifyReply) {
    const ws = await fastify.prisma.wishlist.findMany({
      where: {
        user: { discordId: req.session.discordId }
      }
    });
    return reply.send(ws);
  });

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      body: {
        type: 'object',
        required: ['name', 'wishlist'],
        properties: {
          name: { type: 'string' },
          wishlist: { type: 'object' }
        }
      }
    },
    handler: async function (
      req: FastifyRequest<{ Body: { wishlist: any; name: string; id: number } }>,
      reply: FastifyReply
    ) {
      // creates a wishlist
      await fastify.prisma.wishlist.create({
        data: {
          userId: req.session.dbId,
          name: req.body.name,
          content: req.body.wishlist
        }
      });
      return reply.send('OK');
    }
  });

  fastify.route({
    url: '/:id',
    method: 'POST',
    schema: {
      params: {
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        required: ['name', 'wishlist'],
        properties: {
          name: { type: 'string' },
          wishlist: { type: 'object' }
        }
      }
    },
    handler: async function (
      req: FastifyRequest<{ Params: { id: number }; Body: { wishlist: any; name: string; id: number } }>,
      reply: FastifyReply
    ) {
      const s = await fastify.prisma.wishlist.count({
        where: {
          id: req.params.id,
          userId: req.session.dbId
        }
      });
      if (!s) {
        return reply.status(404).send('Wishlist not found');
      }
      await fastify.prisma.wishlist.update({
        where: {
          id: req.body.id
        },
        data: {
          name: req.body.name,
          content: req.body.wishlist
        }
      });
      return reply.send('OK');
    }
  });

  fastify.route({
    url: '/:id',
    method: 'DELETE',
    schema: {
      params: {
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      }
    },
    handler: async function (req: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) {
      const s = await fastify.prisma.wishlist.count({
        where: {
          id: req.params.id,
          userId: req.session.dbId
        }
      });
      if (!s) {
        return reply.status(404).send('Wishlist not found');
      }
      await fastify.prisma.wishlist.deleteMany({
        where: {
          id: (req.params as { id: number }).id,
          AND: {
            user: { discordId: req.session.discordId }
          }
        }
      });
      return reply.send('OK');
    }
  });
  next();
}
