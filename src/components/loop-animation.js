AFRAME.registerComponent("loop-animation", {
  dependencies: ["animation-mixer"],
  schema: {
    clip: { type: "string", required: true }
  },
  init() {
    const object3DMap = this.el.object3DMap;
    this.model = object3DMap.mesh || object3DMap.scene;

    if (this.model) {
      this.mixer = this.el.components["animation-mixer"].mixer;
    } else {
      this.onModelLoaded = this.onModelLoaded.bind(this);
      this.el.addEventListener("model-loaded", this.onModelLoaded);
    }
  },

  onModelLoaded(event) {
    const animationMixerComponent = this.el.components["animation-mixer"];
    this.model = event.detail.model;
    this.mixer = animationMixerComponent.mixer;

    this.updateClipState(true);

    this.el.removeEventListener(this.onModelLoaded);
  },

  update(oldData) {
    if (oldData.clip !== this.data.clip && this.model) {
      this.updateClipState(true);
    }
  },

  updateClipState(play) {
    const model = this.model;
    const clipName = this.data.clip;

    for (const clip of this.model.animations) {
      if (clip.name === clipName) {
        const action = this.mixer.clipAction(clip, model.parent);

        if (play) {
          action.enabled = true;
          action.setLoop(THREE.LoopRepeat, Infinity).play();
        } else {
          action.stop();
        }

        break;
      }
    }
  },

  destroy() {
    this.updateClipState(false);
    this.el.removeEventListener(this.onModelLoaded);
  }
});
