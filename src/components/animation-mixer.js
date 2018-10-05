/**
 * Instantiates and updates a THREE.AnimationMixer on an entity.
 * @component animation-mixer
 */
AFRAME.registerComponent("animation-mixer", {
  initMixer(model, animations) {
    this.mixer = new THREE.AnimationMixer(model);
    this.animations = animations;
  },

  tick: function(t, dt) {
    if (this.mixer) {
      this.mixer.update(dt / 1000);
    }
  }
});
