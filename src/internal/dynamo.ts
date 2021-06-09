import * as dynamoose from 'dynamoose';

export function models(ttl: number): { users: any; wishlists: any; sessions: any } {
  const users = dynamoose.model(
    'Users',
    new dynamoose.Schema(
      {
        discordId: { type: String, hashKey: true },
        name: String,
        avatar: String,
        locale: String,
        status: String,
        config: { type: Object }
      },
      {
        timestamps: true
      }
    ),
    { waitForActive: { enabled: true } }
  );
  const wishlists = dynamoose.model(
    'Wishlists',
    new dynamoose.Schema(
      {
        id: { type: String, hashKey: true },
        discordId: { type: String, rangeKey: true },
        name: String,
        content: { type: Object }
      },
      {
        saveUnknown: ['content.**'],
        timestamps: true
      }
    ),
    {
      create: true,
      waitForActive: { enabled: true }
    }
  );
  const sessions = dynamoose.model(
    'Sessions',
    new dynamoose.Schema(
      { key: { type: String, hashKey: true }, data: { type: Object } },
      {
        saveUnknown: ['data.**'],
        timestamps: true
      }
    ),
    {
      create: true,
      waitForActive: { enabled: true },
      expires: {
        ttl: ttl,
        attribute: 'ttl'
      }
    }
  );

  return {
    users,
    wishlists,
    sessions
  };
}
