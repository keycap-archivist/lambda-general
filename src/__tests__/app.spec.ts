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
  test('/ws not logged', async () => {
    app.inject({ method: 'GET', url: '/ws' }, (err, response) => {
      expect(err).toBeNull();
      expect(response.statusCode).toBe(401);
    });
  });
  test('/ws logged', async () => {
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
});
