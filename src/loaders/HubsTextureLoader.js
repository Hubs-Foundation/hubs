//
// Based on THREE.TextureLoader
// https://github.com/mrdoob/three.js/blob/master/src/loaders/TextureLoader.js
// Licensed under the MIT license.
// https://github.com/mrdoob/three.js/blob/master/LICENSE
//

// http://www.libpng.org/pub/png/spec/1.2/PNG-Structure.html
const PNGFileSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

// https://en.wikipedia.org/wiki/JPEG_File_Interchange_Format#File_format_structure
// SOI Chunk Header: FF D8
// JFIF / EXIF Chunk Header: FF ?? (either E0 or E1)
const JPEGFileSignature = new Uint8Array([255, 216, 255]);

function signaturesEqual(referenceFileSignature, arrayBuffer) {
  const signatureLength = referenceFileSignature.byteLength;

  if (signatureLength > arrayBuffer.byteLength) {
    return false;
  }

  const bufferView = new Uint8Array(arrayBuffer, 0, signatureLength);

  for (let i = 0; i < signatureLength; i++) {
    if (referenceFileSignature[i] !== bufferView[i]) {
      return false;
    }
  }

  return true;
}

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

    this.loadTextureAsync(texture, url, onProgress)
      .then(onLoad)
      .catch(onError);

    return texture;
  }

  async loadTextureAsync(texture, src, onProgress) {
    let url = src;
    let transparent = true;

    const fileLoader = new THREE.FileLoader(this.manager);
    fileLoader.setResponseType("blob");

    const blob = await loadAsync(fileLoader, src, onProgress);

    const bytes = await new Response(blob).arrayBuffer();

    if (signaturesEqual(PNGFileSignature, bytes)) {
      const dataView = new DataView(bytes);
      const colorType = dataView.getUint8(25);

      if (colorType === 3) {
        // Chunk layout:
        // length - 4 bytes
        // type - 4 bytes
        // data - length bytes
        // crc - 4 bytes

        const chunkHeaderSize = 12; // length + type + crc (excludes data)

        let curChunkOffset = PNGFileSignature.byteLength;
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
    } else if (signaturesEqual(JPEGFileSignature, bytes)) {
      // JPEGs can't have an alpha channel, so memory can be saved by storing them as RGB.
      transparent = false;
    } else {
      console.warn(`Couldn't detect image type for: "${src}". Using RGBA pixel format.`);
    }

    url = URL.createObjectURL(blob);

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

    let image;

    try {
      image = await loadAsync(imageLoader, url, onProgress);
    } catch (e) {
      // Clean up blob url if loading the image fails.
      URL.revokeObjectURL(url);
      throw e;
    }

    // Image was just added to cache before this function gets called, disable caching by immediatly removing it
    THREE.Cache.remove(cacheKey);

    texture.image = image;
    texture.format = transparent ? THREE.RGBAFormat : THREE.RGBFormat;
    texture.needsUpdate = true;

    texture.onUpdate = function() {
      // Delete texture data once it has been uploaded to the GPU
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
