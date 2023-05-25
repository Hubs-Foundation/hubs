import { AudioListenerTag } from "../bit-components";
import { getAudioPosition, isPositionalAudio } from "../bit-systems/audio-emitter-system";
import {
  getCurrentAudioSettings,
  shouldAddSupplementaryAttenuation,
  updateAudioSettings
} from "../update-audio-settings";
import { anyEntityWith } from "../utils/bit-utils";

const distanceModels = {
  linear: function (distance, rolloffFactor, refDistance, maxDistance) {
    return 1.0 - rolloffFactor * ((distance - refDistance) / (maxDistance - refDistance));
  },
  inverse: function (distance, rolloffFactor, refDistance) {
    return refDistance / (refDistance + rolloffFactor * (Math.max(distance, refDistance) - refDistance));
  },
  exponential: function (distance, rolloffFactor, refDistance) {
    return Math.pow(Math.max(distance, refDistance) / refDistance, -rolloffFactor);
  }
};

const calculateAttenuation = (() => {
  const listenerPos = new THREE.Vector3();
  const sourcePos = new THREE.Vector3();
  return (el, audio) => {
    const listenerEid = anyEntityWith(APP.world, AudioListenerTag);
    const listener = APP.world.eid2obj.get(listenerEid);
    listener.getWorldPosition(listenerPos);
    getAudioPosition(el, sourcePos);
    const distance = sourcePos.distanceTo(listenerPos);
    if (isPositionalAudio(audio)) {
      return distanceModels[audio.distanceModel](
        distance,
        audio.rolloffFactor,
        audio.refDistance,
        audio.maxDistance
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
    for (const [el, audio] of APP.audios.entries()) {
      const attenuation = calculateAttenuation(el, audio);

      if (shouldAddSupplementaryAttenuation(el, audio)) {
        APP.supplementaryAttenuation.set(el, attenuation);
        updateAudioSettings(el, audio);
      } else if (APP.supplementaryAttenuation.has(el)) {
        APP.supplementaryAttenuation.delete(el);
        updateAudioSettings(el, audio);
      }

      const isClipped = APP.clippingState.has(el);
      const shouldBeClipped = enableAudioClipping && attenuation < audioClippingThreshold;
      if (isClipped !== shouldBeClipped) {
        if (shouldBeClipped) {
          APP.clippingState.add(el);
        } else {
          APP.clippingState.delete(el);
        }
        updateAudioSettings(el, audio);
      }
    }
  }
}
