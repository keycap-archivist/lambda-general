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
    const now = new Date(Date.now()).getTime();
    return {
      item: r.data,
      stored: r.updatedAt,
      ttl: (r.ttl as number) - now
    };
  }
  async has(key: string) {
    const r = this.model.get({ key });
    return !!r;
  }
  async set(key: string, value: Record<string, unknown>, ttl: number) {
    if (!Object.keys(value).length) {
      await this.model.delete({ key });
    } else {
      await this.model.update({ key }, { data: { ...value }, ttl: new Date(Date.now() + ttl) });
    }
  }
}

export default function (options): DynamoCache {
  return new DynamoCache(options);
}
