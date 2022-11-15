import { disposeTexture } from "./material-utils";

export class TextureCache {
  cache = new Map();

  static key(src, version) {
    return `${src}_${version}`;
  }

  set(src, version, texture) {
    const image = texture.image;
    const cacheKey = TextureCache.key(src, version);
    this.cache.set(cacheKey, {
      cacheKey,
      texture,
      ratio: (image.videoHeight || image.height) / (image.videoWidth || image.width),
      count: 0
    });
    return this.retain(src, version);
  }

  has(src, version) {
    return this.cache.has(TextureCache.key(src, version));
  }

  get(src, version) {
    return this.cache.get(TextureCache.key(src, version));
  }

  retain(src, version) {
    const cacheItem = this.cache.get(TextureCache.key(src, version));
    cacheItem.count++;
    return cacheItem;
  }

  release(src, version) {
    this.releaseByKey(TextureCache.key(src, version));
  }

  releaseByKey(cacheKey) {
    const cacheItem = this.cache.get(cacheKey);

    if (!cacheItem) {
      console.error(`Releasing uncached texture. The cacheKey is: ${cacheKey}`);
      return;
    }

    cacheItem.count--;
    if (cacheItem.count <= 0) {
      // Unload the video element to prevent it from continuing to play in the background
      disposeTexture(cacheItem.texture);
      this.cache.delete(cacheKey);
    }
  }
}
