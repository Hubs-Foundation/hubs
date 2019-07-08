//
// Based on THREE.TextureLoader
// https://github.com/mrdoob/three.js/blob/master/src/loaders/TextureLoader.js
// Licensed under the MIT license.
// https://github.com/mrdoob/three.js/blob/master/LICENSE
//

import { guessContentType } from "../utils/media-utils";

function loadAsync(loader, url, onProgress) {
  return new Promise((resolve, reject) => loader.load(url, resolve, onProgress, reject));
}

function getChunkType(arrayBuffer, byteOffset) {
  const arr = new Uint8Array(arrayBuffer, byteOffset, 4);
  return String.fromCharCode.apply(null, arr);
}

export default class HubsTextureLoader {
  static crossOrigin = "anonymous";

  constructor(manager = THREE.DefaultLoadingManager) {
    this.manager = manager;
  }

  load(url, onLoad, onProgress, onError) {
    const texture = new THREE.Texture();

    this.loadTextureAsync(texture, url, undefined, onProgress)
      .then(onLoad)
      .catch(onError);

    return texture;
  }

  async loadTextureAsync(texture, src, contentType, onProgress) {
    let url = src;
    let transparent = true;

    const finalContentType = contentType || guessContentType(src);

    if (finalContentType === "image/png") {
      const fileLoader = new THREE.FileLoader(this.manager);
      fileLoader.setResponseType("blob");

      const blob = await loadAsync(fileLoader, src, onProgress);

      const bytes = await new Response(blob).arrayBuffer();

      const dataView = new DataView(bytes);
      const colorType = dataView.getUint8(25);

      if (colorType === 3) {
        // http://www.libpng.org/pub/png/spec/1.2/PNG-Structure.html
        // Chunk layout:
        // length - 4 bytes
        // type - 4 bytes
        // data - length bytes
        // crc - 4 bytes

        const fileSignatureLength = 8;
        const chunkHeaderSize = 12; // length + type + crc (excludes data)

        let curChunkOffset = fileSignatureLength;
        let curChunkType = getChunkType(bytes, curChunkOffset + 4);

        while (curChunkType !== "IEND") {
          if (curChunkType === "tRNS") {
            transparent = true;
            break;
          }

          curChunkOffset = curChunkOffset + dataView.getUint32(curChunkOffset) + chunkHeaderSize;
          curChunkType = getChunkType(bytes, curChunkOffset + 4);
        }
      } else if (colorType === 0 || colorType === 2) {
        transparent = false;
      }

      url = URL.createObjectURL(blob);
    } else if (finalContentType === "image/jpeg") {
      // JPEGs can't have an alpha channel, so memory can be saved by storing them as RGB.
      transparent = false;
    }

    let imageLoader;

    if (window.createImageBitmap !== undefined) {
      imageLoader = new THREE.ImageBitmapLoader(this.manager);
      texture.flipY = false;
    } else {
      imageLoader = new THREE.ImageLoader(this.manager);
    }

    imageLoader.setCrossOrigin(this.crossOrigin);
    imageLoader.setPath(this.path);

    const cacheKey = this.manager.resolveURL(src);

    const image = await loadAsync(imageLoader, url, onProgress);

    // Image was just added to cache before this function gets called, disable caching by immediatly removing it
    THREE.Cache.remove(cacheKey);

    texture.image = image;
    texture.format = transparent ? THREE.RGBAFormat : THREE.RGBFormat;
    texture.needsUpdate = true;

    texture.onUpdate = function() {
      texture.image.close && texture.image.close();
      delete texture.image;
      URL.revokeObjectURL(url);
    };

    return texture;
  }

  setCrossOrigin(value) {
    this.crossOrigin = value;
    return this;
  }

  setPath(value) {
    this.path = value;
    return this;
  }
}
