import { SourceType } from "../components/audio-params";
import {
  getCurrentAudioSettings,
  shouldAddSupplementaryAttenuation,
  updateAudioSettings
} from "../update-audio-settings";
import { getClientId } from "../utils/aframe-utils";

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

function isThreeAudio(node) {
  return node instanceof THREE.Audio || node instanceof THREE.PositionalAudio;
}

const calculateAttenuation = (() => {
  const listenerPos = new THREE.Vector3();
  const sourcePos = new THREE.Vector3();
  return (el, obj) => {
    el.sceneEl.audioListener.getWorldPosition(listenerPos);
    obj.getWorldPosition(sourcePos);
    const distance = sourcePos.distanceTo(listenerPos);
    if (isThreeAudio(obj) && obj.panner) {
      return distanceModels[obj.panner.distanceModel](
        distance,
        obj.panner.rolloffFactor,
        obj.panner.refDistance,
        obj.panner.maxDistance
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

// TODO: Rename "GainSystem" because the name is suspicious
export class GainSystem {
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
      if (isClipped !== shouldBeClipped) {
        if (shouldBeClipped) {
          APP.clippingState.add(el);
          if (sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
            getClientId(el).then(peerId => {
              if (peerId) {
                APP.dialog.pauseConsumer(peerId);
                APP.supplementaryAttenuation.delete(el);
                el.components["avatar-audio-source"].removeAudio();
                const nameTagEl = el.querySelector("[name-tag]");
                nameTagEl && nameTagEl.components["name-tag"].consumerPause();
              }
            });
          } else if (sourceType === SourceType.MEDIA_VIDEO) {
            el.components["media-video"].removeAudio();
          }
        } else {
          APP.clippingState.delete(el);
          if (sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
            getClientId(el).then(peerId => {
              if (peerId) {
                APP.dialog.resumeConsumer(peerId);
                el.components["avatar-audio-source"].createAudio();
                const nameTagEl = el.querySelector("[name-tag]");
                nameTagEl && nameTagEl.components["name-tag"].consumerResume();
              }
            });
          } else if (sourceType === SourceType.MEDIA_VIDEO) {
            el.components["media-video"].setupAudio();
          }
          if (APP.audios.has(el)) {
            updateAudioSettings(el, APP.audios.get(el));
          }
        }
      }
    });
  }
}
