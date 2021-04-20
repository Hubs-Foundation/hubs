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
    activeClipIndex: { type: "int", default: 0 },
    activeClipIndices: { type: "array" }
  },

  init() {
    this.mixerEl = findAncestorWithComponent(this.el, "animation-mixer");
    this.currentActions = [];

    if (!this.mixerEl) {
      console.warn("loop-animation component could not find an animation-mixer in its ancestors.");
      return;
    }
  },

  update(oldData) {
    if (this.mixerEl) {
      if (oldData.clip !== this.data.clip || oldData.activeClipIndex !== this.data.activeClipIndex) {
        this.updateClip();
      }

      if (oldData.paused !== this.data.paused) {
        for (let i = 0; i < this.currentActions.length; i++) {
          this.currentActions[i].paused = this.data.paused;
        }
      }
    }
  },

  updateClip() {
    const { mixer, animations } = this.mixerEl.components["animation-mixer"];
    const { clip: clipName, activeClipIndex } = this.data;
    const { activeClipIndices } = this.data;

    if (animations.length === 0) {
      return;
    }

    let clips = [];
    if (activeClipIndices && activeClipIndices.length > 0) {
      // Support for Spoke->Hubs activeClipIndices struct
      clips = activeClipIndices.map(index => animations[index]);
    } else {
      // Support for old Spoke->Hubs { clipName, activeClipIndex } struct. Still used for Blender imports.
      if (clipName !== "") {
        const clipNames = clipName.split(",");
        for (let i = 0; i < clipNames.length; i++) {
          const n = clipNames[i];
          const a = animations.find(({ name }) => name === n);
          if (a) {
            clips.push(a);
          } else {
            console.warn(`Could not find animation named '${n}' in ${this.el.className}`);
          }
        }
      } else {
        clips = [animations[activeClipIndex]];
      }
    }

    if (!(clips && clips.length)) return;

    this.currentActions.length = 0;

    for (let i = 0; i < clips.length; i++) {
      const action = mixer.clipAction(clips[i], this.el.object3D);
      action.enabled = true;
      action.setLoop(THREE.LoopRepeat, Infinity).play();
      this.currentActions.push(action);
    }
  },

  destroy() {
    for (let i = 0; i < this.currentActions.length; i++) {
      this.currentActions[i].enabled = false;
      this.currentActions[i].stop();
    }
    this.currentActions.length = 0;
  }
});
