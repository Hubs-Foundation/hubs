import Cache from "../utils/Cache";

class TextureCache extends Cache {
  dispose(pendingTexture) {
    pendingTexture.then(texture => texture.dispose());
  }
}

AFRAME.registerSystem("texture-cache", {
  init() {
    this.cache = new TextureCache();
  }
});
