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
  constructor() {
    this.transientClippingState = new Set();
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
      if (isClipped !== shouldBeClipped && !this.transientClippingState.has(el)) {
        if (shouldBeClipped) {
          if (sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
            this.transientClippingState.add(el);
            const cmp = el.components["avatar-audio-source"];
            const audio = APP.audios.get(el);
            audio && audio.gain.gain.setTargetAtTime(0, audio.context.currentTime, 0.1);
            setTimeout(() => {
              APP.dialog.disableConsumer(cmp.ownerId, "audio").then(success => {
                if (success) {
                  APP.clippingState.add(el);
                  cmp.removeAudio();
                }
                this.transientClippingState.delete(el);
              });
            }, 1000);
          } else if (sourceType === SourceType.MEDIA_VIDEO) {
            APP.clippingState.add(el);
            el.components["media-video"].removeAudio();
          }
        } else {
          if (sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
            this.transientClippingState.add(el);
            const cmp = el.components["avatar-audio-source"];
            APP.dialog.enableConsumer(cmp.ownerId, "audio").then(success => {
              if (success) {
                APP.clippingState.delete(el);
                cmp.createAudio();
              }
              this.transientClippingState.delete(el);
            });
          } else if (sourceType === SourceType.MEDIA_VIDEO) {
            APP.clippingState.delete(el);
            el.components["media-video"].setupAudio();
          }
        }
      }
    });
  }
}
