import { THREE } from "aframe";

const zero = new THREE.Vector3(0, 0, 0);

/**
 * Represents an audio-zone-entity that has an audio component in the audio-zones-system.
 * Expects an audio-params component. It can be an audio, video, avatar or an audio target.
 */
AFRAME.registerComponent("audio-zone-source", {
  dependencies: ["audio-zone-entity"],

  init() {
    this.originalAudioParamsData = null;
    this.entity = this.el.components["audio-zone-entity"];
    this.el.sceneEl.systems["hubs-systems"].audioZonesSystem.registerSource(this);
  },

  remove() {
    this.el.sceneEl.systems["hubs-systems"].audioZonesSystem.unregisterSource(this);
  },

  // Returns the audio source world position.
  getPosition() {
    return this.el.components["audio-params"].data.position || zero;
  },

  // Updates the audio-params component with new audio parameters.
  apply(params) {
    if (!this.originalAudioParamsData) {
      const data = this.el.components["audio-params"].data;
      this.originalAudioParamsData = {
        distanceModel: data.distanceModel,
        maxDistance: data.maxDistance,
        refDistance: data.refDistance,
        rolloffFactor: data.rolloffFactor,
        coneInnerAngle: data.coneInnerAngle,
        coneOuterAngle: data.coneOuterAngle,
        coneOuterGain: data.coneOuterGain,
        gain: data.gain
      };
    }
    this.el.setAttribute("audio-params", params);
  },

  restore() {
    if (this.originalAudioParamsData) {
      this.el.setAttribute("audio-params", this.originalAudioParamsData);
    }
  }
});
