import { Vector3 } from "three";
import { AudioNormalizer } from "../utils/audio-normalizer";
import { CLIPPING_THRESHOLD_ENABLED, CLIPPING_THRESHOLD_DEFAULT } from "../react-components/preferences-screen";
import { AvatarAudioDefaults, DISTANCE_MODEL_OPTIONS } from "../systems/audio-settings-system";

export const SourceType = Object.freeze({ MEDIA_VIDEO: 0, AVATAR_AUDIO_SOURCE: 1, AVATAR_RIG: 2, AUDIO_TARGET: 3 });

const MUTE_DELAY_SECS = 1;

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

AFRAME.registerComponent("audio-params", {
  schema: {
    enabled: { default: true },
    isLocal: { default: false },
    position: { type: "vec3", default: { x: 0, y: 0, z: 0 } },
    orientation: { type: "vec3", default: { x: 0, y: 0, z: 0 } },
    distanceModel: { default: AvatarAudioDefaults.DISTANCE_MODEL, oneOf: [DISTANCE_MODEL_OPTIONS] },
    rolloffFactor: { default: AvatarAudioDefaults.ROLLOFF_FACTOR },
    refDistance: { default: AvatarAudioDefaults.REF_DISTANCE },
    maxDistance: { default: AvatarAudioDefaults.MAX_DISTANCE },
    clippingEnabled: { default: CLIPPING_THRESHOLD_ENABLED },
    clippingThreshold: { default: CLIPPING_THRESHOLD_DEFAULT },
    prevGain: { default: 1.0 },
    isClipped: { default: false },
    gain: { default: 1.0 },
    sourceType: { default: -1 },
    attenuation: { default: 1.0 },
    distance: { default: 0.0 },
    squaredDistance: { default: 0.0 }
  },

  init() {
    this.avatarRigPosition = new THREE.Vector3();
    this.avatarAudio = {
      panner: {
        orientationX: {
          value: 0
        },
        orientationY: {
          value: 0
        },
        orientationZ: {
          value: 0
        },
        positionX: {
          value: 0
        },
        positionY: {
          value: 0
        },
        positionZ: {
          value: 0
        },
        distanceModel: AvatarAudioDefaults.DISTANCE_MODEL,
        maxDistance: AvatarAudioDefaults.MAX_DISTANCE,
        refDistance: AvatarAudioDefaults.REF_DISTANCE,
        rolloffFactor: AvatarAudioDefaults.ROLLOFF_FACTOR,
        coneInnerAngle: AvatarAudioDefaults.INNER_ANGLE,
        coneOuterAngle: AvatarAudioDefaults.OUTER_ANGLE,
        coneOuterGain: AvatarAudioDefaults.OUTER_GAIN
      }
    };
    this.avatarRigOrientation = new THREE.Vector3(0, 0, -1);
    this.listenerPos = new THREE.Vector3();
    this.data.position = new Vector3(0.0, 0.0, 0.0);
    this.data.orientation = new Vector3(0.0, 0.0, 0.0);
    this.normalizer = null;
    this.el.sceneEl?.systems["audio-debug"].registerSource(this);
    if (!this.data.isLocal) {
      this.el.sceneEl?.systems["hubs-systems"].gainSystem.registerSource(this);
    }

    const { enableAudioClipping, audioClippingThreshold } = window.APP.store.state.preferences;
    this.data.clippingEnabled = enableAudioClipping !== undefined ? enableAudioClipping : CLIPPING_THRESHOLD_ENABLED;
    this.data.clippingThreshold =
      audioClippingThreshold !== undefined ? audioClippingThreshold : CLIPPING_THRESHOLD_DEFAULT;

    this.onVolumeUpdated = this.volumeUpdated.bind(this);
    this.onSourceSetAdded = this.sourceSetAdded.bind(this);
    if (this.data.isLocal) {
      this.data.sourceType = SourceType.AVATAR_RIG;
    } else if (this.el.components["media-video"]) {
      this.data.sourceType = SourceType.MEDIA_VIDEO;
      this.data.gain = this.el.components["media-video"].data.volume;
      this.el.addEventListener("media-volume-changed", this.onVolumeUpdated);
    } else if (this.el.components["avatar-audio-source"]) {
      this.data.sourceType = SourceType.AVATAR_AUDIO_SOURCE;
      this.data.gain =
        this.el.parentEl?.parentEl?.querySelector("[avatar-volume-controls]").components["avatar-volume-controls"]?.data
          .volume || 1.0;
      this.el.parentEl?.parentEl?.addEventListener("avatar-volume-changed", this.onVolumeUpdated);
    } else if (this.el.components["audio-target"]) {
      this.data.sourceType = SourceType.AUDIO_TARGET;
    }
  },

  remove() {
    this.normalizer = null;
    this.el.sceneEl?.systems["audio-debug"].unregisterSource(this);
    if (!this.data.isLocal) {
      this.el.sceneEl?.systems["hubs-systems"].gainSystem.unregisterSource(this);
    }

    this.el.removeEventListener("media-volume-changed", this.onVolumeUpdated);
    this.el.parentEl?.parentEl?.removeEventListener("avatar-volume-changed", this.onVolumeUpdated);

    if (this.data.sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
      this.el.components["avatar-audio-source"].el.removeEventListener("sound-source-set", this.onSourceSetAdded);
    }
  },

  tick() {
    const audio = this.audio();
    if (audio) {
      if (audio.updateMatrixWorld) {
        audio.updateMatrixWorld(true);
      }
      this.data.position = new THREE.Vector3(
        audio.panner.positionX.value,
        audio.panner.positionY.value,
        audio.panner.positionZ.value
      );
      this.data.orientation = new THREE.Vector3(
        audio.panner.orientationX.value,
        audio.panner.orientationY.value,
        audio.panner.orientationZ.value
      );
      this.data.distanceModel = audio.panner.distanceModel;
      this.data.rolloffFactor = audio.panner.rolloffFactor;
      this.data.refDistance = audio.panner.refDistance;
      this.data.maxDistance = audio.panner.maxDistance;
      this.data.coneInnerAngle = audio.panner.coneInnerAngle;
      this.data.coneOuterAngle = audio.panner.coneOuterAngle;
      this.data.coneOuterGain = audio.panner.coneOuterGain;
      this.updateDistances();
      this.updateAttenuation();
    }

    if (this.normalizer !== null) {
      this.normalizer.apply();
    } else {
      // We one only enable the Normalizer for avatar-audio-source components
      if (this.data.sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
        this.enableNormalizer();
      }
    }
  },

  audio() {
    if (this.data.sourceType === SourceType.AVATAR_RIG) {
      // Create fake parametes for the avatar rig as it doens't have an audio source.
      const audioParams = this.el.sceneEl.systems["hubs-systems"].audioSettingsSystem.audioSettings;
      const avatarRigObj = document.getElementById("avatar-rig").querySelector(".camera").object3D;
      avatarRigObj.updateMatrixWorld(true);
      avatarRigObj.getWorldPosition(this.avatarRigPosition);
      this.avatarRigOrientation.set(0, 0, -1);
      const worldQuat = new THREE.Quaternion();
      avatarRigObj.getWorldQuaternion(worldQuat);
      this.avatarRigOrientation.applyQuaternion(worldQuat);
      this.avatarAudio.panner.orientationX.value = this.avatarRigOrientation.x;
      this.avatarAudio.panner.orientationY.value = this.avatarRigOrientation.y;
      this.avatarAudio.panner.orientationZ.value = this.avatarRigOrientation.z;
      this.avatarAudio.panner.positionX.value = this.avatarRigPosition.x;
      this.avatarAudio.panner.positionY.value = this.avatarRigPosition.y;
      this.avatarAudio.panner.positionZ.value = this.avatarRigPosition.z;
      this.avatarAudio.panner.distanceModel = audioParams.avatarDistanceModel;
      this.avatarAudio.panner.maxDistance = audioParams.avatarMaxDistance;
      this.avatarAudio.panner.refDistance = audioParams.avatarRefDistance;
      this.avatarAudio.panner.rolloffFactor = audioParams.avatarRolloffFactor;
      this.avatarAudio.panner.coneInnerAngle = audioParams.avatarConeInnerAngle;
      this.avatarAudio.panner.coneOuterAngle = audioParams.avatarConeOuterAngle;
      this.avatarAudio.panner.coneOuterGain = audioParams.avatarConeOuterGainain;
      return this.avatarAudio;
    } else if (this.data.sourceType === SourceType.MEDIA_VIDEO) {
      const audio = this.el.getObject3D("sound");
      return audio?.panner ? audio : null;
    } else if (this.data.sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
      const audio = this.el.getObject3D("avatar-audio-source");
      return audio?.panner ? audio : null;
    } else if (this.data.sourceType === SourceType.AUDIO_TARGET) {
      const audio = this.el.getObject3D("audio-target");
      return audio?.panner ? audio : null;
    }
  },

  enableNormalizer() {
    const audio = this.audio();
    if (audio) {
      const avatarAudioSource = this.el.components["avatar-audio-source"];
      if (avatarAudioSource) {
        this.normalizer = new AudioNormalizer(audio);
        avatarAudioSource.el.addEventListener("sound-source-set", this.onSourceSetAdded);
      }
    }
  },

  sourceSetAdded() {
    const avatarAudioSource = this.el.components["avatar-audio-source"];
    const audio = avatarAudioSource && avatarAudioSource.el.getObject3D(avatarAudioSource.attrName);
    if (audio) {
      this.normalizer = new AudioNormalizer(audio);
      this.normalizer.apply();
    }
  },

  updateDistances() {
    this.el.sceneEl.audioListener.getWorldPosition(this.listenerPos);
    this.data.distance = this.data.position.distanceTo(this.listenerPos);
    this.data.squaredDistance = this.data.position.distanceToSquared(this.listenerPos);
  },

  updateAttenuation() {
    this.data.attenuation = distanceModels[this.data.distanceModel](
      this.data.distance,
      this.data.rolloffFactor,
      this.data.refDistance,
      this.data.maxDistance
    );
  },

  clipGain(gain) {
    if (!this.data.isClipped) {
      const audio = this.audio();
      this.data.isClipped = true;
      this.data.prevGain = this.data.gain;
      this.data.gain = gain;
      this.data.gain = this.data.gain === 0 ? 0.001 : this.data.gain;
      audio.gain.gain.exponentialRampToValueAtTime(this.data.gain, audio.context.currentTime + MUTE_DELAY_SECS);
    }
  },

  unclipGain() {
    if (this.data.isClipped) {
      const audio = this.audio();
      this.data.isClipped = false;
      this.data.gain = this.data.prevGain;
      this.data.gain = this.data.gain === 0 ? 0.001 : this.data.gain;
      audio?.gain?.gain.exponentialRampToValueAtTime(this.data.gain, audio.context.currentTime + MUTE_DELAY_SECS);
    }
  },

  updateGain(newGain) {
    const audio = this.audio();
    if (this.data.isClipped) {
      this.data.prevGain = newGain;
    } else {
      this.data.prevGain = this.data.gain;
      this.data.gain = newGain;
    }
    this.data.gain = this.data.gain === 0 ? 0.001 : this.data.gain;
    audio?.gain?.gain.exponentialRampToValueAtTime(this.data.gain, audio.context.currentTime + MUTE_DELAY_SECS);
  },

  volumeUpdated({ detail: volume }) {
    let globalVolume = 100;
    const { audioOutputMode, globalVoiceVolume, globalMediaVolume } = window.APP.store.state.preferences;
    if (this.data.sourceType === SourceType.MEDIA_VIDEO) {
      globalVolume = globalMediaVolume;
    } else if (this.data.sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
      globalVolume = globalVoiceVolume;
    }
    const volumeModifier = (globalVolume !== undefined ? globalVolume : 100) / 100;
    let newGain = volumeModifier * volume;
    if (audioOutputMode === "audio") {
      newGain = this.data.gain * Math.min(1, 10 / Math.max(1, this.data.squaredDistance));
    }
    this.updateGain(newGain);
  },

  clippingUpdated({ clippingEnabled, clippingThreshold }) {
    this.data.clippingEnabled = clippingEnabled !== undefined ? clippingEnabled : CLIPPING_THRESHOLD_ENABLED;
    this.data.clippingThreshold = clippingThreshold !== undefined ? clippingThreshold : CLIPPING_THRESHOLD_DEFAULT;
  }
});
