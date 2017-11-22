import "../vendor/GLTFLoader";

const GLTFCache = {};

/**
 * glTF model loader.
 */
AFRAME.registerComponent("gltf-model2", {
  schema: { type: "model" },

  init: function() {
    this.model = null;
    this.loader = new THREE.GLTFLoader();
    this.onLoad = this.onLoad.bind(this);
    this.onError = this.onError.bind(this);
  },

  update: function() {
    const self = this;
    const el = this.el;
    const src = this.data;

    if (!src) {
      return;
    }

    const cachedModel = GLTFCache[src];

    if (cachedModel) {
      this.model = cachedModel.clone(true);
      this.model.visible = true;
      this.model.animations = cachedModel.animations;
      this.el.setObject3D("mesh", this.model);
      this.el.emit("model-loaded", { format: "gltf", model: this.model });
    }

    this.remove();

    this.loader.load(
      src,
      this.onLoad,
      undefined /* onProgress */,
      this.onError
    );
  },

  onLoad(gltfModel) {
    this.model = gltfModel.scene || gltfModel.scenes[0];
    this.model.animations = gltfModel.animations;
    GLTFCache[this.data] = this.model;
    this.el.setObject3D("mesh", this.model);
    this.el.emit("model-loaded", { format: "gltf", model: this.model });
  },

  onError(error) {
    const message =
      error && error.message ? error.message : "Failed to load glTF model";
    console.warn(message);
    this.el.emit("model-error", { format: "gltf", src: this.data });
  },

  remove: function() {
    if (!this.model) {
      return;
    }
    this.el.removeObject3D("mesh");
  }
});
