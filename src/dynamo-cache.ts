// import type { ModelType, AnyDocument } from 'dynamoose';

class DynamoCache {
  await = true;
  model: any;
  constructor(options) {
    this.model = options.model;
  }
  async delete(key: string) {
    await this.model.delete({ key });
  }
  async get(key: string) {
    const r = await this.model.get({ key });
    if (!r) {
      return {};
    }
    return {
      item: r.data,
      stored: r.updatedAt,
      ttl: r.ttl
    };
  }
  async has(key: string) {
    const r = this.model.get({ key });
    return !!r;
  }
  async set(key: string, value: Record<string, unknown>, ttl: number) {
    await this.model.update({ key }, { data: { ...value }, ttl: Date.now() + ttl });
  }
}

export default function (options): DynamoCache {
  return new DynamoCache(options);
}
