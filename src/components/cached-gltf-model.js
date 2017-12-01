import "../vendor/GLTFLoader";

const GLTFCache = {};

// From https://gist.github.com/cdata/f2d7a6ccdec071839bc1954c32595e87
// Tracking glTF cloning here: https://github.com/mrdoob/three.js/issues/11573
function cloneGltf(gltf) {
  const clone = {
    animations: gltf.animations,
    scene: gltf.scene.clone(true)
  };

  const skinnedMeshes = {};

  gltf.scene.traverse(node => {
    if (node.isSkinnedMesh) {
      skinnedMeshes[node.name] = node;
    }
  });

  const cloneBones = {};
  const cloneSkinnedMeshes = {};

  clone.scene.traverse(node => {
    if (node.isBone) {
      cloneBones[node.name] = node;
    }

    if (node.isSkinnedMesh) {
      cloneSkinnedMeshes[node.name] = node;
    }
  });

  for (const name in skinnedMeshes) {
    const skinnedMesh = skinnedMeshes[name];
    const skeleton = skinnedMesh.skeleton;
    const cloneSkinnedMesh = cloneSkinnedMeshes[name];

    const orderedCloneBones = [];

    for (let i = 0; i < skeleton.bones.length; ++i) {
      const cloneBone = cloneBones[skeleton.bones[i].name];
      orderedCloneBones.push(cloneBone);
    }

    cloneSkinnedMesh.bind(
      new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
      cloneSkinnedMesh.matrixWorld
    );

    cloneSkinnedMesh.material = skinnedMesh.material.clone();
  }

  return clone;
}

/**
 * glTF model loader.
 */
AFRAME.registerComponent("cached-gltf-model", {
  schema: { type: "model" },

  init: function() {
    this.model = null;
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

    // Remove any existing model
    this.remove();

    // Load the gltf model from the cache if it exists.
    const gltf = GLTFCache[src];

    if (gltf) {
      // Use a cloned copy of the cached model.
      const clonedGltf = cloneGltf(gltf);
      this.onLoad(clonedGltf);
      return;
    }

    // Otherwise load the new gltf model.
    new THREE.GLTFLoader().load(
      src,
      this.onLoad,
      undefined /* onProgress */,
      this.onError
    );
  },

  onLoad(gltfModel) {
    if (!GLTFCache[this.data]) {
      // Store a cloned copy of the gltf model.
      GLTFCache[this.data] = cloneGltf(gltfModel);
    }

    this.model = gltfModel.scene || gltfModel.scenes[0];
    this.model.animations = gltfModel.animations;

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
