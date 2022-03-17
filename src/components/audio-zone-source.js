import { THREE } from "aframe";
import { updateAudioSettings } from "../update-audio-settings";

AFRAME.registerComponent("audio-zone-source", {
  init() {
    this.originalAudioParamsData = null;
    this.el.sceneEl.systems["hubs-systems"]?.audioZonesSystem.registerSource(this);
  },

  remove() {
    APP.zoneOverrides.delete(this.el);
    this.el.sceneEl.systems["hubs-systems"]?.audioZonesSystem.unregisterSource(this);
  },

  getPosition: (() => {
    const sourcePos = new THREE.Vector3();
    return function() {
      const audio = APP.audios.get(this.el);
      if (audio) {
        audio.getWorldPosition(sourcePos);
      } else {
        sourcePos.set(0, 0, 0);
      }
      return sourcePos;
    };
  })(),

  apply(params) {
    APP.zoneOverrides.set(this.el, params);
    const audio = APP.audios.get(this.el);
    if (audio) {
      updateAudioSettings(this.el, audio);
    }
  },

  restore() {
    APP.zoneOverrides.delete(this.el);
    const audio = APP.audios.get(this.el);
    if (audio) {
      updateAudioSettings(this.el, audio);
    }
  }
});
