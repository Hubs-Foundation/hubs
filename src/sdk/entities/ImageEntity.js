import { EntityMixin } from "../EntityMixin";
import { Image } from "../objects/Image";
import { RethrownError } from "../utils/errors";

export class ImageEntity extends EntityMixin(Image) {
  constructor() {
    super();
    this._canonicalUrl = "";
    this.controls = true;
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    const nextValue = value || "";
    const changed = nextValue !== this._canonicalUrl;
    this._canonicalUrl = nextValue;

    if (this.world && changed) {
      this.load(value).catch(console.error);
    }
  }

  onAdded() {
    if (this._canonicalUrl !== "") {
      this.load(this._canonicalUrl).catch(console.error);
    }
  }

  loadTexture(src) {
    return this.world.textureCache.get(src);
  }

  async load(src, onError) {
    this._mesh.visible = false;

    // this.hideErrorIcon();
    // this.showLoadingCube();

    try {
      const { accessibleUrl } = await this.world.resolveMedia(src);
      await super.load(accessibleUrl);
    } catch (error) {
      // this.showErrorIcon();

      const imageError = new RethrownError(`Error loading image ${this._canonicalUrl}`, error);

      if (onError) {
        onError(this, imageError);
      }

      console.error(imageError);
    }

    // this.hideLoadingCube();

    return this;
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    this.controls = source.controls;
    this._canonicalUrl = source._canonicalUrl;

    return this;
  }
}
