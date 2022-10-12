import { TextureCache } from "../utils/texture-cache";
import { errorTexture } from "../utils/error-texture";
import { createImageTexture } from "../utils/media-utils";
import { createBasisTexture, createKTX2Texture } from "../utils/create-basis-texture";
import { createGIFTexture } from "../utils/gif-texture";
import { makeCancelable } from "./coroutine";

const textureCache = new TextureCache();
const inflightTextures = new Map();
const errorCacheItem = { texture: errorTexture, ratio: 1400 / 1200 };

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

async function loadTexture(src, version, contentType) {
  if (textureCache.has(src, version)) {
    return textureCache.retain(src, version);
  }

  if (src === "error") {
    return errorCacheItem;
  }

  const inflightKey = textureCache.key(src, version);
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

export async function releaseTexture(src, version) {
  textureCache.release(src, version);
}

export function loadTextureCancellable(src, version, contentType) {
  const p = loadTexture(src, version, contentType);
  return makeCancelable(() => {
    // TODO: Pass in an AbortSignal through to loadTexture so that we can cancel inflight requests.
    p.then(() => {
      releaseTexture(src, version);
    });
  }, p);
}
