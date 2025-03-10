import { isIOS as detectIOS } from "../utils/is-mobile";

const isIOS = detectIOS();

// Disable ImageBitmap for Firefox so far because
// createImageBitmap() with option fails on Firefox due to the bug.
// Three.js ImageBitmapLoader passes {colorSpaceConversion: 'none'} option.
// Without the option, the rendering result can be wrong if image file has ICC profiles.
// See https://github.com/mrdoob/three.js/pull/21336
const HAS_IMAGE_BITMAP =
  window.createImageBitmap !== undefined && /Firefox/.test(navigator.userAgent) === false && !isIOS;
export const TEXTURES_FLIP_Y = !HAS_IMAGE_BITMAP;

// Browsers on iOS devices can crash if huge or many textures are used in a room.
// Perhaps huge VRAM usage may cause it. We already reported it to the webkit devs.
// Until the root issue is fixed on iOS end, we resize huge texture images in the
// low material quality mode as workaround. It isn't a perfect solution but it
// should mitigate the problem. Also disable image bitmap (See the above)
// because huge textures resize + image bitmap can still even crash browsers.
//
// See
//   - https://github.com/Hubs-Foundation/hubs/issues/5295
//   - https://bugs.webkit.org/show_bug.cgi?id=241478

const IOS_TEXTURE_MAX_WIDTH = 2048;
const IOS_TEXTURE_MAX_HEIGHT = 2048;

function resizeIfNeeded(texture) {
  if (!isIOS || window.APP.store.state.preferences.materialQualitySetting !== "low") {
    return texture;
  }

  const image = texture.image;

  // Just in case.
  if (!image || image.width === undefined || image.height === undefined) {
    return texture;
  }

  if (image.width <= IOS_TEXTURE_MAX_WIDTH && image.height <= IOS_TEXTURE_MAX_HEIGHT) {
    return texture;
  }

  const conversionRatio = Math.min(IOS_TEXTURE_MAX_WIDTH / image.width, IOS_TEXTURE_MAX_HEIGHT / image.height);

  const newWidth = Math.round(image.width * conversionRatio);
  const newHeight = Math.round(image.height * conversionRatio);

  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, newWidth, newHeight);

  texture.image = canvas;

  if (image.close !== undefined) {
    image.close();
  }

  texture.format = THREE.RGBAFormat;
  texture.type = THREE.UnsignedByteType;
  return texture;
}

export default class HubsTextureLoader extends THREE.TextureLoader {
  constructor(manager) {
    super(manager);
  }

  load(url, onLoad, onProgress, onError) {
    const callback = texture => {
      resizeIfNeeded(texture);
      if (onLoad) {
        onLoad(texture);
      }
    };

    const texture = HAS_IMAGE_BITMAP
      ? this._loadImageBitmapTexture(url, callback, onProgress, onError)
      : super.load(url, callback, onProgress, onError);

    texture.onUpdate = function () {
      // Delete texture data once it has been uploaded to the GPU
      texture.image.close && texture.image.close();
      texture.image = null;
    };

    return texture;
  }

  async loadAsync(url, onProgress) {
    return new Promise((resolve, reject) => {
      this.load(url, resolve, onProgress, reject);
    });
  }

  _loadImageBitmapTexture(url, onLoad, onProgress, onError) {
    const texture = new THREE.Texture();
    const loader = new THREE.ImageBitmapLoader(this.manager);
    loader.setCrossOrigin(this.crossOrigin);
    loader.setPath(this.path);

    loader.load(
      url,
      bitmap => {
        texture.image = bitmap;
        texture.needsUpdate = true;

        // We close the image bitmap when it's uploaded to texture.
        // Closed image bitmap can't be reused so we remove the cache
        // added in ImageBitmapLoader.
        // You can remove this line once we entirely disable THREE.Cache.
        THREE.Cache.remove(this.manager.resolveURL(url));

        if (onLoad !== undefined) {
          onLoad(texture);
        }
      },
      onProgress,
      onError
    );

    texture.flipY = false;
    return texture;
  }
}
