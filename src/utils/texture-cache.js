import { disposeTexture } from "./material-utils";

export class TextureCache {
  cache = new Map();

  key(src, version) {
    return `${src}_${version}`;
  }

  set(src, version, texture) {
    const image = texture.image;
    this.cache.set(this.key(src, version), {
      texture,
      ratio: (image.videoHeight || image.height) / (image.videoWidth || image.width),
      count: 0
    });
    return this.retain(src, version);
  }

  has(src, version) {
    return this.cache.has(this.key(src, version));
  }

  get(src, version) {
    return this.cache.get(this.key(src, version));
  }

  retain(src, version) {
    const cacheItem = this.cache.get(this.key(src, version));
    cacheItem.count++;
    // console.log("retain", src, cacheItem.count);
    return cacheItem;
  }

  release(src, version) {
    const cacheItem = this.cache.get(this.key(src, version));

    if (!cacheItem) {
      console.error(`Releasing uncached texture src ${src}`);
      return;
    }

    cacheItem.count--;
    // console.log("release", src, cacheItem.count);
    if (cacheItem.count <= 0) {
      // Unload the video element to prevent it from continuing to play in the background
      disposeTexture(cacheItem.texture);
      this.cache.delete(this.key(src, version));
    }
  }
}
