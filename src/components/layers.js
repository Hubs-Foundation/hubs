export const Layers = {
  // Layers 0 - 2 reserverd by ThreeJS and AFrame.
  reflection: 3
};

AFRAME.registerComponent("layers", {
  schema: {
    reflection: { type: "boolean", default: false }
  },
  init() {
    this.update = this.update.bind(this);
    this.el.addEventListener("model-loaded", this.update);
  },
  update(oldData) {
    if (this.data.reflection !== oldData.reflection) {
      if (this.data.reflection) {
        this.el.object3D.traverse(obj => {
          obj.layers.enable(Layers.reflection);
        });
      } else {
        this.el.object3D.traverse(obj => {
          obj.layers.disable(Layers.reflection);
        });
      }
    }
  },
  remove() {
    this.el.removeEventListener("model-loaded", this.update);
  }
});
