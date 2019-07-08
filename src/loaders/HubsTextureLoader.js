/**
 * @author mrdoob / http://mrdoob.com/
 */

import { RGBAFormat, RGBFormat, ImageLoader, ImageBitmapLoader, Texture, DefaultLoadingManager, Cache } from "three";

export default class HubsTextureLoader {
  static crossOrigin = "anonymous";

  constructor(manager = DefaultLoadingManager) {
    this.manager = manager;
  }

  load(url, onLoad, onProgress, onError) {
    const texture = new Texture();

    let loader;
    if (window.createImageBitmap !== undefined) {
      loader = new ImageBitmapLoader(this.manager);
      texture.flipY = false;
    } else {
      loader = new ImageLoader(this.manager);
    }

    loader.setCrossOrigin(this.crossOrigin);
    loader.setPath(this.path);

    const cacheKey = this.manager.resolveURL(url);
    loader.load(
      url,
      function(image) {
        // Image was just added to cache before this function gets called, disable caching by immediatly removing it
        Cache.remove(cacheKey);

        texture.image = image;

        // JPEGs can't have an alpha channel, so memory can be saved by storing them as RGB.
        const isJPEG = url.search(/\.jpe?g($|\?)/i) > 0 || url.search(/^data:image\/jpeg/) === 0;

        texture.format = isJPEG ? RGBFormat : RGBAFormat;
        texture.needsUpdate = true;

        texture.onUpdate = function() {
          texture.image.close && texture.image.close();
          delete texture.image;
        };

        if (onLoad !== undefined) {
          onLoad(texture);
        }
      },
      onProgress,
      onError
    );

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
