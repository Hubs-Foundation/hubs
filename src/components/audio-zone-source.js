import { THREE } from "aframe";

AFRAME.registerComponent("audio-zone-source", {
  init() {
    this.originalAudioParamsData = null;
    this.isModified = false;
    this.el.sceneEl.systems["hubs-systems"].audioZonesSystem.registerSource(this);
  },

  remove() {
    this.el.sceneEl.systems["hubs-systems"].audioZonesSystem.unregisterSource(this);
  },

  getPosition: () => {
    const sourcePos = new THREE.Vector3();
    return () => {
      if (this.el.components["audio-params"].audioRef) {
        this.el.components["audio-params"].audioRef.getWorldPosition(sourcePos);
        return sourcePos.clone();
      }
      return new THREE.Vector3(0, 0, 0);
    };
  },

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
    this.isModified = true;
  },

  restore() {
    if (this.isModified && this.originalAudioParamsData) {
      this.el.setAttribute("audio-params", this.originalAudioParamsData);
      this.isModified = false;
    }
  }
});
