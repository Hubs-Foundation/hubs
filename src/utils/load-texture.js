import { TextureCache } from "../utils/texture-cache";
import { errorTexture } from "../utils/error-texture";
import { createImageTexture } from "../utils/media-utils";
import { createBasisTexture, createKTX2Texture } from "../utils/create-basis-texture";
import { createGIFTexture } from "../utils/gif-texture";
import { withRollback } from "./coroutine-utils";

const textureCache = new TextureCache();
// Prime the cache with the error texture.
// We don't want to wait for the errorImage to finish loading, so hardcode the ratio and add it now.
// We don't ever want to deallocate / dispose the texture, so set the count to 1.
textureCache.cache.set(TextureCache.key("error", 1), {
  cacheKey: TextureCache.key("error", 1),
  texture: errorTexture,
  ratio: 1400 / 1200,
  count: 1
});
const inflightTextures = new Map();

function createTexture(contentType, src) {
  if (contentType.includes("image/gif")) {
    return createGIFTexture(src);
  }
  if (contentType.includes("image/basis")) {
    return createBasisTexture(src);
  }
  if (contentType.includes("image/ktx2")) {
    return createKTX2Texture(src);
  }
  if (contentType.startsWith("image/")) {
    return createImageTexture(src);
  }

  throw new Error(`Unknown image content type: ${contentType}`);
}

export function loadTextureFromCache(src, version) {
  if (!textureCache.has(src, version)) {
    throw new Error(`Texture not in cache: ${src} ${version}`);
  }
  return textureCache.retain(src, version);
}

export async function loadTexture(src, version, contentType) {
  if (textureCache.has(src, version)) {
    return textureCache.retain(src, version);
  }

  const inflightKey = TextureCache.key(src, version);
  if (inflightTextures.has(inflightKey)) {
    await inflightTextures.get(inflightKey);
    return textureCache.retain(src, version);
  }

  const promise = createTexture(contentType, src);
  inflightTextures.set(inflightKey, promise);
  try {
    const texture = await promise;
    return textureCache.set(src, version, texture);
  } finally {
    inflightTextures.delete(inflightKey);
  }
}

export async function releaseTextureByKey(cacheKey) {
  textureCache.releaseByKey(cacheKey);
}

export function loadTextureCancellable(src, version, contentType) {
  const p = loadTexture(src, version, contentType);
  return withRollback(p, () => {
    // TODO: Pass in an AbortSignal through to loadTexture so that we can cancel inflight requests.
    p.then(({ cacheKey }) => {
      releaseTextureByKey(cacheKey);
    });
  });
}
