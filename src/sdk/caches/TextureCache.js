import { TextureLoader } from "three";
import { Cache } from "./Cache";
import { loadTexture } from "../utils/loadTexture";

export class TextureCache extends Cache {
  constructor() {
    super();
    this.textureLoader = new TextureLoader();
  }

  get(url) {
    const absoluteURL = new URL(url, window.location).href;
    if (!this._cache.has(absoluteURL)) {
      this._cache.set(absoluteURL, loadTexture(absoluteURL, this.textureLoader));
    }
    return this._cache.get(absoluteURL);
  }

  disposeAndClear() {
    for (const texturePromise of this._cache.values()) {
      texturePromise.then(texture => texture.dispose());
    }
    this._clear();
  }
}
