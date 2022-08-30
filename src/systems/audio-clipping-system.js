import { SourceType } from "../components/audio-params";
import {
  getCurrentAudioSettings,
  shouldAddSupplementaryAttenuation,
  updateAudioSettings
} from "../update-audio-settings";

const distanceModels = {
  linear: function(distance, rolloffFactor, refDistance, maxDistance) {
    return 1.0 - rolloffFactor * ((distance - refDistance) / (maxDistance - refDistance));
  },
  inverse: function(distance, rolloffFactor, refDistance) {
    return refDistance / (refDistance + rolloffFactor * (Math.max(distance, refDistance) - refDistance));
  },
  exponential: function(distance, rolloffFactor, refDistance) {
    return Math.pow(Math.max(distance, refDistance) / refDistance, -rolloffFactor);
  }
};

const calculateAttenuation = (() => {
  const listenerPos = new THREE.Vector3();
  const sourcePos = new THREE.Vector3();
  return (el, audio) => {
    el.sceneEl.audioListener.getWorldPosition(listenerPos);
    audio.getWorldPosition(sourcePos);
    const distance = sourcePos.distanceTo(listenerPos);
    if (audio.panner) {
      return distanceModels[audio.panner.distanceModel](
        distance,
        audio.panner.rolloffFactor,
        audio.panner.refDistance,
        audio.panner.maxDistance
        // TODO: Why are coneInnerAngle, coneOuterAngle and coneOuterGain not used?
      );
    } else {
      const { distanceModel, rolloffFactor, refDistance, maxDistance } = getCurrentAudioSettings(el);
      if (!distanceModel) {
        // Apparently, it is valid to give null as your distanceModel
        return 1.0;
      }
      if (!distanceModels[distanceModel]) {
        // TODO: Validate properties earlier in the process.
        console.error("Unrecognized distance model.");
        return 1.0;
      }

      return distanceModels[distanceModel](distance, rolloffFactor, refDistance, maxDistance);
    }
  };
})();

export class AudioClippingSystem {
  constructor(scene) {
    this.recalculateClipping = true;
    scene.addEventListener("scene-entered", () => { this.recalculateClipping = true; })
  }

  tick() {
    const { enableAudioClipping, audioClippingThreshold } = window.APP.store.state.preferences;
    APP.audioElements.forEach(el => {
      const attenuation = calculateAttenuation(el, APP.audios.get(el) || el.object3D);

      if (APP.audios.has(el)) {
        const audio = APP.audios.get(el);
        if (shouldAddSupplementaryAttenuation(el, audio)) {
          APP.supplementaryAttenuation.set(el, attenuation);
          updateAudioSettings(el, audio);
        } else if (APP.supplementaryAttenuation.has(el)) {
          APP.supplementaryAttenuation.delete(el);
          updateAudioSettings(el, audio);
        }
      }

      const isClipped = APP.clippingState.has(el);
      const shouldBeClipped = enableAudioClipping && attenuation < audioClippingThreshold;
      const sourceType = APP.sourceType.get(el);
      if (isClipped !== shouldBeClipped || this.recalculateClipping) {
        if (shouldBeClipped) {
          APP.clippingState.add(el);
          if (sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
            el.components["avatar-audio-source"].disableConsumer();
          } else if (sourceType === SourceType.MEDIA_VIDEO) {
            el.components["media-video"].removeAudio();
          }
        } else {
          APP.clippingState.delete(el);
          if (sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
            el.components["avatar-audio-source"].enableConsumer();
          } else if (sourceType === SourceType.MEDIA_VIDEO) {
            el.components["media-video"].setupAudio();
          }
        }
      }
    });
    this.recalculateClipping = false;
  }
}
