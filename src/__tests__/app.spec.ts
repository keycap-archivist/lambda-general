import app from '../app';

describe('App', () => {
  beforeAll(async () => {
    app.get('/__SETSESSION', (req, res) => {
      req.session.discordId = '666';
      req.session.name = 'TEST_AGENT';
      res.send({ msg: 'ok' });
    });
    await app.listen(9999);
  });
  afterAll(async () => {
    await app.close();
  });
  test('Info', async () => {
    app.inject({ method: 'GET', url: '/info' }, (err, response) => {
      expect(err).toBeNull();
      expect(response.statusCode).toBe(200);
    });
  });
  test('Not logged', async () => {
    app.inject({ method: 'GET', url: '/ws' }, (err, response) => {
      expect(err).toBeNull();
      expect(response.statusCode).toBe(401);
    });
  });
  describe('Wishlist', () => {
    test('/ws', async () => {
      const c = await app.inject({ method: 'GET', url: '/__SETSESSION' });
      const r = await app.inject({
        method: 'GET',
        url: '/ws',
        headers: {
          cookie: c.headers['set-cookie']
        }
      });
      expect(r.statusCode).toBe(200);
    });
    test('/ws POST Update Get', async () => {
      const c = await app.inject({ method: 'GET', url: '/__SETSESSION' });
      const r = await app.inject({
        method: 'POST',
        url: '/ws',
        headers: {
          cookie: c.headers['set-cookie']
        },
        //@ts-ignore
        body: {
          name: 'foobar',
          wishlist: { nested: { property: 'inside' } }
        }
      });
      expect(r.statusCode).toBe(200);
      const updatedWishlist = {
        name: 'foobar',
        wishlist: { NOP: { dd: 'foo' } }
      };
      const r2 = await app.inject({
        method: 'POST',
        url: `/ws/${JSON.parse(r.body).id}`,
        headers: {
          cookie: c.headers['set-cookie']
        },
        //@ts-ignore
        body: updatedWishlist
      });
      expect(r2.statusCode).toBe(200);
      const r3 = await app.inject({
        method: 'GET',
        url: `/ws/${JSON.parse(r.body).id}`,
        headers: {
          cookie: c.headers['set-cookie']
        }
      });
      expect(r3.statusCode).toBe(200);
      expect(JSON.parse(r3.body).content).toEqual(updatedWishlist.wishlist);
      const r4 = await app.inject({
        method: 'GET',
        url: `/ws/noop`,
        headers: {
          cookie: c.headers['set-cookie']
        }
      });
      expect(r4.statusCode).toBe(404);
    });
  });
});
