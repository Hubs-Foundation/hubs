import { findAncestorWithComponent } from "../utils/scene-graph";

/**
 * Loops the given clip using this entity's animation mixer
 * @component loop-animation
 */
AFRAME.registerComponent("loop-animation", {
  schema: {
    paused: { type: "boolean", default: false },
    /* DEPRECATED: Use activeClipIndex instead since animation names are not unique */
    clip: { type: "string", default: "" },
    activeClipIndex: { type: "int", default: 0 }
  },

  init() {
    this.mixerEl = findAncestorWithComponent(this.el, "animation-mixer");

    if (!this.mixerEl) {
      console.warn("loop-animation component could not find an animation-mixer in its ancestors.");
      return;
    }

    this.updateClip();
  },

  update(oldData) {
    if (this.mixerEl) {
      if (oldData.clip !== this.data.clip || oldData.activeClipIndex !== this.data.activeClipIndex) {
        this.updateClip();
      }

      if (oldData.paused !== this.data.paused && this.currentAction) {
        this.currentAction.paused = this.data.paused;
      }
    }
  },

  updateClip() {
    const { mixer, animations } = this.mixerEl.components["animation-mixer"];
    const { clip: clipName, activeClipIndex } = this.data;

    if (animations.length === 0) {
      return;
    }

    let clip;

    if (clipName !== "") {
      clip = animations.find(({ name }) => name === clipName);
    } else {
      clip = animations[activeClipIndex];
    }

    if (!clip) {
      return;
    }

    const action = mixer.clipAction(clip, this.el.object3D);
    action.enabled = true;
    action.setLoop(THREE.LoopRepeat, Infinity).play();
    this.currentAction = action;
  },

  destroy() {
    if (this.currentAction) {
      this.currentAction.enabled = false;
      this.currentAction.stop();
    }
  }
});
