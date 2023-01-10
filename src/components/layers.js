import { Layers } from "../camera-layers";

/**
 * Sets layer flags on the underlying Object3D
 * @namespace environment
 * @component layers
 */
AFRAME.registerComponent("layers", {
  schema: {
    mask: { default: Layers.CAMERA_LAYER_DEFAULT },
    recursive: { default: false }
  },
  init() {
    this.update = this.update.bind(this);
    this.el.addEventListener("object3dset", this.update);
  },
  update() {
    const obj = this.el.object3D;
    if (this.data.recursive) {
      obj.traverse(o => (o.layers.mask = this.data.mask));
    } else {
      obj.layers.mask = this.data.mask;
    }
  },
  remove() {
    this.el.removeEventListener("object3dset", this.update);
  }
});
