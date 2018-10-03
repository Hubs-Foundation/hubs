/**
 * Instantiates and updates a THREE.AnimationMixer on an entity.
 * @component animation-mixer
 */
AFRAME.registerComponent("animation-mixer", {
  init() {
    this.mixer = null;

    const object3DMap = this.el.object3DMap;
    const rootObject3D = object3DMap.mesh || object3DMap.scene;

    if (rootObject3D) {
      this.setAnimationMixer(rootObject3D);
    } else {
      this.onModelLoaded = this.onModelLoaded.bind(this);
      this.el.addEventListener("model-loaded", this.onModelLoaded);
    }
  },

  onModelLoaded(event) {
    const sceneObject3D = event.detail.model;
    this.setAnimationMixer(sceneObject3D);

    this.el.removeEventListener("model-loaded", this.onModelLoaded);
  },

  setAnimationMixer(rootObject3D) {
    this.mixer = new THREE.AnimationMixer(rootObject3D);
  },

  tick: function(t, dt) {
    if (this.mixer) {
      this.mixer.update(dt / 1000);
    }
  },

  destroy() {
    this.el.removeEventListener("model-loaded", this.onModelLoaded);
  }
});
