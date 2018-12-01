export default class Cache {
  constructor() {
    this.cache = new Map();
  }

  has(src) {
    return this.cache.has(src);
  }

  get(src) {
    const cacheItem = this.cache.get(src);

    if (cacheItem) {
      return cacheItem.resource;
    }

    return null;
  }

  set(src, resource) {
    this.cache.set(src, {
      resource,
      count: 1
    });

    return resource;
  }

  retain(src) {
    const cacheItem = this.cache.get(src);

    if (cacheItem) {
      cacheItem.count++;
      return cacheItem.resource;
    }

    return null;
  }

  release(src) {
    const cacheItem = this.cache.get(src);

    if (!cacheItem) {
      return;
    }

    cacheItem.count--;

    if (cacheItem.count === 0) {
      this.dispose();
      this.cache.delete(src);
    }
  }

  dispose() {}
}
