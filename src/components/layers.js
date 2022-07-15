export const Layers = {
  // These 3 layers are hardcoded in THREE
  CAMERA_LAYER_DEFAULT: 0,
  CAMERA_LAYER_XR_LEFT_EYE: 1,
  CAMERA_LAYER_XR_RIGHT_EYE: 2,

  CAMERA_LAYER_REFLECTION: 3,
  CAMERA_LAYER_INSPECT: 4,
  CAMERA_LAYER_VIDEO_TEXTURE_TARGET: 5,

  CAMERA_LAYER_THIRD_PERSON_ONLY: 6,
  CAMERA_LAYER_FIRST_PERSON_ONLY: 7
};

/**
 * Sets layer flags on the underlying Object3D
 * @namespace environment
 * @component layers
 */
AFRAME.registerComponent("layers", {
  schema: {
    reflection: { type: "boolean", default: false },
    inWorldHud: { type: "boolean", default: false },
    exclusive: { type: "boolean", default: false } // if true, only these layers will be set
  },
  init() {
    this.update = this.update.bind(this);
    this.el.addEventListener("model-loaded", this.update);
  },
  update(oldData) {
    const obj = this.el.object3D;

    if (this.data.exclusive) {
      obj.traverse(o => (o.layers.mask = 0));
    }

    for (const [name, layer] of Object.entries(Layers)) {
      const oldValue = oldData[name];
      const newValue = this.data[name];

      if (oldValue !== newValue) {
        if (newValue) {
          obj.traverse(o => o.layers.enable(layer));
        } else {
          obj.traverse(o => o.layers.disable(layer));
        }
      }
    }
  },
  remove() {
    this.el.removeEventListener("model-loaded", this.update);
  }
});
