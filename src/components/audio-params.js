import { Vector3 } from "three";
import { AudioNormalizer } from "../utils/audio-normalizer";
import { CLIPPING_THRESHOLD_ENABLED, CLIPPING_THRESHOLD_DEFAULT } from "../react-components/preferences-screen";
import { AvatarAudioDefaults, DISTANCE_MODEL_OPTIONS } from "../systems/audio-settings-system";

export const SourceType = Object.freeze({ MEDIA_VIDEO: 0, AVATAR_AUDIO_SOURCE: 1, AVATAR_RIG: 2 });

const MUTE_DELAY_SECS = 1;

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
    this.data.position = new Vector3(0.0, 0.0, 0.0);
    this.data.orientation = new Vector3(0.0, 0.0, 0.0);
    this.normalizer = null;
    this.el.sceneEl?.systems["audio-debug"].registerSource(this);
    if (!this.data.isLocal) {
      this.el.sceneEl?.systems["audio-gain"].registerSource(this);
    }

    const { enableAudioClipping, audioClippingThreshold } = window.APP.store.state.preferences;
    this.data.clippingEnabled = enableAudioClipping !== undefined ? enableAudioClipping : CLIPPING_THRESHOLD_ENABLED;
    this.data.clippingThreshold =
      audioClippingThreshold !== undefined ? audioClippingThreshold : CLIPPING_THRESHOLD_DEFAULT;

    this.onVolumeUpdated = this.volumeUpdated.bind(this);
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
    }
  },

  remove() {
    this.normalizer = null;
    this.el.sceneEl?.systems["audio-debug"].unregisterSource(this);
    if (!this.data.isLocal) {
      this.el.sceneEl?.systems["audio-gain"].unregisterSource(this);
    }

    if (this.el.components["media-video"]) {
      this.el.removeEventListener("media-volume-changed", this.onVolumeUpdated);
    } else if (this.el.components["avatar-audio-source"]) {
      this.el.parentEl?.parentEl?.removeEventListener("avatar-volume-changed", this.onVolumeUpdated);
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
      const position = new THREE.Vector3();
      avatarRigObj.getWorldPosition(position);
      const direction = new THREE.Vector3(0, 0, -1);
      const worldQuat = new THREE.Quaternion();
      avatarRigObj.getWorldQuaternion(worldQuat);
      direction.applyQuaternion(worldQuat);
      return {
        panner: {
          orientationX: {
            value: direction.x
          },
          orientationY: {
            value: direction.y
          },
          orientationZ: {
            value: direction.z
          },
          positionX: {
            value: position.x
          },
          positionY: {
            value: position.y
          },
          positionZ: {
            value: position.z
          },
          distanceModel: audioParams.avatarDistanceModel,
          maxDistance: audioParams.avatarMaxDistance,
          refDistance: audioParams.avatarRefDistance,
          rolloffFactor: audioParams.avatarRolloffFactor,
          coneInnerAngle: audioParams.avatarConeInnerAngle,
          coneOuterAngle: audioParams.avatarConeOuterAngle,
          coneOuterGain: audioParams.avatarConeOuterGain
        }
      };
    } else if (this.data.sourceType === SourceType.MEDIA_VIDEO) {
      const audio = this.el.getObject3D("sound");
      return audio instanceof THREE.PositionalAudio ? audio : null;
    } else if (this.data.sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
      const audio = this.el.getObject3D("avatar-audio-source");
      return audio instanceof THREE.PositionalAudio ? audio : null;
    }
  },

  enableNormalizer() {
    const audio = this.audio();
    if (audio) {
      const avatarAudioSource = this.el.components["avatar-audio-source"];
      if (avatarAudioSource) {
        this.normalizer = new AudioNormalizer(audio);
        avatarAudioSource.el.addEventListener("sound-source-set", () => {
          const audio = avatarAudioSource && avatarAudioSource.el.getObject3D(avatarAudioSource.attrName);
          if (audio) {
            this.normalizer = new AudioNormalizer(audio);
            this.normalizer.apply();
          }
        });
      }
    }
  },

  updateDistances() {
    const listenerPos = new THREE.Vector3();
    this.el.sceneEl.audioListener.getWorldPosition(listenerPos);
    this.data.distance = this.data.position.distanceTo(listenerPos);
    this.data.squaredDistance = this.data.position.distanceToSquared(listenerPos);
  },

  updateAttenuation() {
    if (this.data.distanceModel === "linear") {
      this.data.attenuation = this.att_linear();
    } else if (this.data.distanceModel === "inverse") {
      this.data.attenuation = this.att_inverse();
    } else if (this.data.distanceModel === "exponential") {
      this.data.attenuation = this.att_exponential();
    }
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
  },

  att_linear() {
    return (
      1.0 -
      this.data.rolloffFactor *
        ((this.data.distance - this.data.refDistance) / (this.data.maxDistance - this.data.refDistance))
    );
  },

  att_inverse() {
    return (
      this.data.refDistance /
      (this.data.refDistance +
        this.data.rolloffFactor * (Math.max(this.data.distance, this.data.refDistance) - this.data.refDistance))
    );
  },

  att_exponential() {
    return Math.pow(
      Math.max(this.data.distance, this.data.refDistance) / this.data.refDistance,
      -this.data.rolloffFactor
    );
  }
});
