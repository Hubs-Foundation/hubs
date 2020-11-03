function loadAsync(loader, url, onProgress) {
  return new Promise((resolve, reject) => loader.load(url, resolve, onProgress, reject));
}

const HAS_IMAGE_BITMAP = window.createImageBitmap !== undefined;
export const TEXTURES_FLIP_Y = !HAS_IMAGE_BITMAP;

export default class HubsTextureLoader {
  constructor(manager = THREE.DefaultLoadingManager) {
    this.manager = manager;
    this.crossOrigin = "anonymous";
  }

  load(url, onLoad, onProgress, onError) {
    const texture = new THREE.Texture();

    this.loadTextureAsync(texture, url, onProgress)
      .then(onLoad)
      .catch(onError);

    return texture;
  }

  async loadTextureAsync(texture, src, onProgress) {
    let imageLoader;

    if (HAS_IMAGE_BITMAP) {
      imageLoader = new THREE.ImageBitmapLoader(this.manager);
      texture.flipY = false;
    } else {
      imageLoader = new THREE.ImageLoader(this.manager);
    }

    imageLoader.setCrossOrigin(this.crossOrigin);
    imageLoader.setPath(this.path);

    const resolvedUrl = this.manager.resolveURL(src);

    texture.image = await loadAsync(imageLoader, resolvedUrl, onProgress);

    // Image was just added to cache before this function gets called, disable caching by immediatly removing it
    THREE.Cache.remove(resolvedUrl);

    texture.needsUpdate = true;

    texture.onUpdate = function() {
      // Delete texture data once it has been uploaded to the GPU
      texture.image.close && texture.image.close();
      delete texture.image;
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
