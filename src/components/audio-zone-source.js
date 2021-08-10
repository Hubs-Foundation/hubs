import { THREE } from "aframe";
import { updateAudioSettings } from "../update-audio-settings";

AFRAME.registerComponent("audio-zone-source", {
  init() {
    this.originalAudioParamsData = null;
    this.el.sceneEl.systems["hubs-systems"].audioZonesSystem.registerSource(this);
  },

  remove() {
    APP.zoneOverrides.delete(this.el);
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
    APP.zoneOverrides.set(this.el, params);
    const audio = APP.audios.get(this.el);
    if (audio) {
      updateAudioSettings(this.el, audio);
    }

    //TODO: remove
    this.el.setAttribute("audio-params", params);
  },

  restore() {
    APP.zoneOverrides.delete(this.el);
    const audio = APP.audios.get(this.el);
    if (audio) {
      updateAudioSettings(this.el, audio);
    }

    // TODO: remove
    this.el.setAttribute("audio-params", this.originalAudioParamsData);
  }
});
