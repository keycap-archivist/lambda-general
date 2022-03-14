import app from './app';
import tap from 'tap';

const { before, test, teardown } = tap;

before(async () => {
  app.get('/__SETSESSION', (req, res) => {
    req.session.discordId = '666';
    req.session.name = 'TEST_AGENT';
    res.send({ msg: 'ok' });
  });
  await app.listen(9999);
});

teardown(async () => {
  await app.close();
});

test('App: Info', (t) => {
  t.plan(2);
  app.inject({ method: 'GET', url: '/info' }, (err, response) => {
    t.equal(err, null);
    t.equal(response.statusCode, 200);
  });
});
test('App: Not logged', (t) => {
  t.plan(2);
  app.inject({ method: 'GET', url: '/ws' }, (err, response) => {
    t.equal(err, null);
    t.equal(response.statusCode, 401);
  });
});
test('/ws', async (t) => {
  t.plan(1);
  const c = await app.inject({ method: 'GET', url: '/__SETSESSION' });
  const r = await app.inject({
    method: 'GET',
    url: '/ws',
    headers: {
      cookie: c.headers['set-cookie']
    }
  });
  t.equal(r.statusCode, 200);
});
test('/ws POST Update Get', async (t) => {
  t.plan(5);
  const c = await app.inject({ method: 'GET', url: '/__SETSESSION' });
  const r = await app
    .inject({
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
    })
    .end();

  t.equal(r.statusCode, 200);
  const updatedWishlist = {
    name: 'foobar',
    wishlist: { NOP: { dd: 'foo' } }
  };
  const r2 = await app
    .inject({
      method: 'POST',
      url: `/ws/${JSON.parse(r.body).id}`,
      headers: {
        cookie: c.headers['set-cookie']
      },
      //@ts-ignore
      body: updatedWishlist
    })
    .end();
  t.equal(r2.statusCode, 200);
  const r3 = await app.inject({
    method: 'GET',
    url: `/ws/${JSON.parse(r.body).id}`,
    headers: {
      cookie: c.headers['set-cookie']
    }
  });
  t.equal(r3.statusCode, 200);
  t.strictSame(JSON.parse(r3.body).content, updatedWishlist.wishlist);
  const r4 = await app.inject({
    method: 'GET',
    url: `/ws/noop`,
    headers: {
      cookie: c.headers['set-cookie']
    }
  });
  t.equal(r4.statusCode, 404);
});
