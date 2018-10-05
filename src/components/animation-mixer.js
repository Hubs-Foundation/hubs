/**
 * Instantiates and updates a THREE.AnimationMixer on an entity.
 * @component animation-mixer
 */
AFRAME.registerComponent("animation-mixer", {
  initMixer(animations) {
    this.mixer = new THREE.AnimationMixer(this.el.object3D);
    this.el.object3D.animations = animations;
    this.animations = animations;
  },

  tick: function(t, dt) {
    if (this.mixer) {
      this.mixer.update(dt / 1000);
    }
  }
});
