import { v4 as uuidv4 } from 'uuid';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default function wishlist(fastify: FastifyInstance, opts, next): void {
  // get users wishlist
  fastify.get(
    '/',
    {
      schema: {
        description: 'Get all the wishlists',
        tags: ['authenticated']
      }
    },
    async function (req: FastifyRequest, reply: FastifyReply) {
      const ws = await fastify.dynamooseModels.wishlists.scan({ discordId: { eq: `${req.session.discordId}` } }).exec();
      return reply.send(ws);
    }
  );

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: {
      description: 'Get a wishlist',
      tags: ['authenticated'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    },
    handler: async function (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
      const ws = await fastify.dynamooseModels.wishlists
        .scan({ id: { eq: `${req.params.id}` }, discordId: { eq: `${req.session.discordId}` } })
        .exec();
      return reply.send(ws);
    }
  });

  // creates a wishlist
  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      description: 'Create a new wishlist',
      tags: ['authenticated'],
      body: {
        type: 'object',
        required: ['name', 'wishlist'],
        properties: {
          name: { type: 'string' },
          wishlist: { type: 'object' }
        }
      }
    },
    handler: async function (req: FastifyRequest<{ Body: { wishlist: any; name: string } }>, reply: FastifyReply) {
      const s = await fastify.dynamooseModels.wishlists
        .scan({ discordId: { eq: `${req.session.discordId}` } })
        .count()
        .exec();
      if (s >= 10) {
        return reply.status(400).send({ msg: 'You cant have more than 10 wishlists' });
      }
      const id = uuidv4();
      await fastify.dynamooseModels.wishlists.create({
        id: id,
        discordId: req.session.discordId,
        name: req.body.name,
        content: req.body.wishlist
      });
      return reply.send({ id: id, msg: 'OK' });
    }
  });

  // update a wishlist
  fastify.route({
    url: '/:id',
    method: 'POST',
    schema: {
      description: 'Update a wishlist',
      tags: ['authenticated'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
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
      req: FastifyRequest<{ Params: { id: string }; Body: { wishlist: any; name: string } }>,
      reply: FastifyReply
    ) {
      const s = await fastify.dynamooseModels.wishlists.get({ id: req.params.id, discordId: req.session.discordId });

      if (!s) {
        return reply.status(404).send({ msg: 'Wishlist not found' });
      }
      await fastify.dynamooseModels.wishlists.update(
        {
          id: req.params.id,
          discordId: req.session.discordId
        },
        {
          name: req.body.name,
          content: req.body.wishlist
        }
      );
      return reply.send({ msg: 'OK' });
    }
  });

  // delete a wishlist
  fastify.route({
    url: '/:id',
    method: 'DELETE',
    schema: {
      description: 'Delete a wishlist',
      tags: ['authenticated'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      }
    },
    handler: async function (req: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) {
      await fastify.dynamooseModels.wishlists.delete({ id: req.params.id, discordId: req.session.discordId });
      return reply.send({ msg: 'OK' });
    }
  });

  next();
}
