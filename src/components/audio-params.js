import { AudioNormalizer } from "../utils/audio-normalizer";
import { CLIPPING_THRESHOLD_ENABLED, CLIPPING_THRESHOLD_DEFAULT } from "../react-components/preferences-screen";

export const DISTANCE_MODEL_OPTIONS = ["linear", "inverse", "exponential"];

export const SourceType = Object.freeze({
  MEDIA_VIDEO: 0,
  AVATAR_AUDIO_SOURCE: 1,
  // TODO: Fill in missing value (2)
  AUDIO_TARGET: 3,
  AUDIO_ZONE: 4
});

export const AudioType = {
  Stereo: "stereo",
  PannerNode: "pannernode"
};

export const DistanceModelType = {
  Linear: "linear",
  Inverse: "inverse",
  Exponential: "exponential"
};

export const AvatarAudioDefaults = Object.freeze({
  AUDIO_TYPE: AudioType.PannerNode,
  distanceModel: DistanceModelType.Inverse,
  rolloffFactor: 2,
  refDistance: 1,
  maxDistance: 10000,
  coneInnerAngle: 180,
  coneOuterAngle: 360,
  coneOuterGain: 0,
  VOLUME: 1.0
});

export const MediaAudioDefaults = Object.freeze({
  AUDIO_TYPE: AudioType.PannerNode,
  distanceModel: DistanceModelType.Inverse,
  rolloffFactor: 1,
  refDistance: 1,
  maxDistance: 10000,
  coneInnerAngle: 360,
  coneOuterAngle: 0,
  coneOuterGain: 0,
  VOLUME: 0.5
});

export const TargetAudioDefaults = Object.freeze({
  AUDIO_TYPE: AudioType.PannerNode,
  distanceModel: DistanceModelType.Inverse,
  rolloffFactor: 5,
  refDistance: 8,
  maxDistance: 10000,
  coneInnerAngle: 170,
  coneOuterAngle: 300,
  coneOuterGain: 0.3,
  VOLUME: 1.0
});

export const GAIN_TIME_CONST = 0.2;

AFRAME.registerComponent("audio-params", {
  multiple: true,
  schema: {
    enabled: { default: true },
    debuggable: { default: true },
    audioType: { default: AvatarAudioDefaults.AUDIO_TYPE },
    clippingEnabled: { default: CLIPPING_THRESHOLD_ENABLED },
    clippingThreshold: { default: CLIPPING_THRESHOLD_DEFAULT },
    preClipGain: { default: 1.0 },
    isClipped: { default: false },
    gain: { default: 1.0 },
    sourceType: { default: -1 }
  },

  init() {
    this.audioRef = null;
    this.listenerPos = new THREE.Vector3();
    this.normalizer = null;
    this.el.sceneEl?.systems["audio-debug"].registerSource(this);
    if (!this.data.isLocal) {
      this.el.sceneEl?.systems["hubs-systems"].gainSystem.registerSource(this);
    }

    const { enableAudioClipping, audioClippingThreshold } = window.APP.store.state.preferences;
    const clippingEnabled = enableAudioClipping !== undefined ? enableAudioClipping : CLIPPING_THRESHOLD_ENABLED;
    const clippingThreshold =
      audioClippingThreshold !== undefined ? audioClippingThreshold : CLIPPING_THRESHOLD_DEFAULT;

    this.onSourceSetAdded = this.sourceSetAdded.bind(this);
    let sourceType;
    if (this.el.components["media-video"]) {
      sourceType = SourceType.MEDIA_VIDEO;
    } else if (this.el.components["avatar-audio-source"]) {
      sourceType = SourceType.AVATAR_AUDIO_SOURCE;
    } else if (this.el.components["audio-target"]) {
      sourceType = SourceType.AUDIO_TARGET;
    } else if (this.el.components["audio-zone"]) {
      sourceType = SourceType.AUDIO_ZONE;
    }

    this.el.setAttribute("audio-params", {
      sourceType,
      clippingEnabled,
      clippingThreshold
    });
  },

  remove() {
    this.normalizer = null;
    this.el.sceneEl?.systems["audio-debug"].unregisterSource(this);
    if (!this.data.isLocal) {
      this.el.sceneEl?.systems["hubs-systems"].gainSystem.unregisterSource(this);
    }

    if (this.data.sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
      this.el.components["avatar-audio-source"].el.removeEventListener("sound-source-set", this.onSourceSetAdded);
    }
  },

  update() {
    if (this.audioRef) {
      // TODO: Move the gain stuff to update-audio-settings
      this.data.gain !== undefined && this.updateGain(this.data.gain);
    }
  },

  tick() {
    if (this.normalizer !== null) {
      this.normalizer.apply();
    } else {
      // We one only enable the Normalizer for avatar-audio-source components
      if (this.data.sourceType === SourceType.AVATAR_AUDIO_SOURCE) {
        this.enableNormalizer();
      }
    }
  },

  setAudio(audio) {
    this.audioRef = audio;
  },

  enableNormalizer() {
    if (this.audioRef) {
      const avatarAudioSource = this.el.components["avatar-audio-source"];
      if (avatarAudioSource) {
        this.normalizer = new AudioNormalizer(this.audioRef);
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

  clipGain(gain) {
    if (!this.data.isClipped) {
      this.el.setAttribute("audio-params", {
        isClipped: true,
        preClipGain: this.data.gain,
        gain
      });
    }
  },

  unclipGain() {
    if (this.data.isClipped) {
      this.el.setAttribute("audio-params", {
        isClipped: false,
        gain: this.data.preClipGain
      });
    }
  },

  updateGain(newGain) {
    if (!this.audioRef) return;

    let gainFilter;
    switch (this.data.sourceType) {
      case SourceType.MEDIA_VIDEO: {
        gainFilter = this.el.components["media-video"].getGainFilter();
        break;
      }
      case SourceType.AVATAR_AUDIO_SOURCE: {
        gainFilter = this.el.components["avatar-audio-source"].getGainFilter();
        break;
      }
      case SourceType.AUDIO_TARGET: {
        gainFilter = this.el.components["audio-target"].getGainFilter();
        break;
      }
    }
    const { audioOutputMode } = window.APP.store.state.preferences;
    if (audioOutputMode === "audio") {
      const sourcePos = new THREE.Vector3();
      const listenerPos = new THREE.Vector3();
      this.audioRef.getWorldPosition(sourcePos);
      this.el.sceneEl.audioListener.getWorldPosition(listenerPos);
      const squaredDistance = sourcePos.distanceToSquared(listenerPos);
      this.data.gain = newGain * Math.min(1, 10 / Math.max(1, squaredDistance));
    }
    gainFilter?.gain.setTargetAtTime(this.data.gain, this.audioRef.context.currentTime, GAIN_TIME_CONST);
  },

  updateClipping() {
    const { clippingEnabled, clippingThreshold } = window.APP.store.state.preferences;
    this.el.setAttribute("audio-params", {
      clippingEnabled: clippingEnabled !== undefined ? clippingEnabled : CLIPPING_THRESHOLD_ENABLED,
      clippingThreshold: clippingThreshold !== undefined ? clippingThreshold : CLIPPING_THRESHOLD_DEFAULT
    });
  }
});
