function findModel(entity) {
  while (entity && !(entity.components && entity.components["gltf-model-plus"])) {
    entity = entity.parentNode;
  }
  return entity;
}

/**
 * Loops the given clip using this entity's animation mixer
 * @component loop-animation
 */
AFRAME.registerComponent("loop-animation", {
  schema: {
    clip: { type: "string" }
  },
  init() {
    this.mixerEl = findModel(this.el);

    this.onMixerReady = this.onMixerReady.bind(this);

    if (!this.mixerEl) {
      return;
    }

    if (this.mixerEl.components["animation-mixer"]) {
      this.onMixerReady();
    } else {
      this.el.addEventListener("model-loaded", this.onMixerReady);
    }
  },

  onMixerReady() {
    this.mixer = this.mixerEl.components["animation-mixer"].mixer;
    this.updateClip();
  },

  update(oldData) {
    if (oldData.clip !== this.data.clip && this.mixer) {
      this.updateClip();
    }
  },

  updateClip() {
    const mixer = this.mixer;
    const root = mixer.getRoot();
    const animations = root.animations;
    const clipName = this.data.clip;

    if (!animations || animations.length === 0) {
      return;
    }

    let clip;

    if (!clipName) {
      clip = animations[0];
    } else {
      clip = animations.find(({ name }) => name === clipName);
    }

    if (!clip) {
      return;
    }

    const action = this.mixer.clipAction(clip, this.el.object3D);
    action.enabled = true;
    action.setLoop(THREE.LoopRepeat, Infinity).play();
    this.currentAction = action;
  },

  destroy() {
    if (this.currentAction) {
      this.currentAction.enabled = false;
      this.currentAction.stop();
    }

    if (this.mixerEl) {
      this.mixerEl.removeEventListener("model-loaded", this.onMixerReady);
    }
  }
});
