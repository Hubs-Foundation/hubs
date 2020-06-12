/**
 * Instantiates and updates a THREE.AnimationMixer on an entity.
 * @component animation-mixer
 */

const components = [];
export class AnimationMixerSystem {
  tick(dt) {
    for (let i = 0; i < components.length; i++) {
      const cmp = components[i];
      if (cmp.mixer) {
        cmp.mixer.update(dt / 1000);
      }
    }
  }
}

AFRAME.registerComponent("animation-mixer", {
  initMixer(animations) {
    this.mixer = new THREE.AnimationMixer(this.el.object3D);
    this.el.object3D.animations = animations;
    this.animations = animations;
  },
  play() {
    components.push(this);
  },
  pause() {
    components.splice(components.indexOf(this), 1);
  }
});
