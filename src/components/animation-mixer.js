/**
 * Instantiates and updates a THREE.AnimationMixer on an entity.
 * @component animation-mixer
 */

import { NETWORK_POSES } from "./hand-poses";

const leftRightFilter = new RegExp("(_L)|(_R)");

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

    //Fix hand pose animations by removing unnecessary VectorKeyframeTracks (Position and Scale)
    this.animations.forEach(animClip => {
      //Check if this is really a hand pose
      if (animClip && NETWORK_POSES.includes(animClip.name.replace(leftRightFilter, ""))) {
        //Filter out EVERY track that is NOT a quaternion track and therefor not rotation related
        animClip.tracks = animClip.tracks.filter(track => track.ValueTypeName == "quaternion");
        //Filter out the quaternion track of the Hand bone!!! Otherwise the hand still rotation flickers in place
        animClip.tracks.splice(animClip.tracks.length - 3, 3);
      }
    });
  },
  play() {
    components.push(this);
  },
  pause() {
    components.splice(components.indexOf(this), 1);
  }
});
