import { AudioNormalizer } from "../utils/audio-normalizer";
import { CLIPPING_THRESHOLD_ENABLED, CLIPPING_THRESHOLD_DEFAULT } from "../react-components/preferences-screen";

export const DISTANCE_MODEL_OPTIONS = ["linear", "inverse", "exponential"];

export const SourceType = Object.freeze({
  MEDIA_VIDEO: 0,
  AVATAR_AUDIO_SOURCE: 1,
  AVATAR_RIG: 2,
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
  DISTANCE_MODEL: DistanceModelType.Inverse,
  ROLLOFF_FACTOR: 2,
  REF_DISTANCE: 1,
  MAX_DISTANCE: 10000,
  INNER_ANGLE: 180,
  OUTER_ANGLE: 360,
  OUTER_GAIN: 0,
  VOLUME: 1.0
});

export const MediaAudioDefaults = Object.freeze({
  AUDIO_TYPE: AudioType.PannerNode,
  DISTANCE_MODEL: DistanceModelType.Inverse,
  ROLLOFF_FACTOR: 1,
  REF_DISTANCE: 1,
  MAX_DISTANCE: 10000,
  INNER_ANGLE: 360,
  OUTER_ANGLE: 0,
  OUTER_GAIN: 0,
  VOLUME: 0.5
});

export const TargetAudioDefaults = Object.freeze({
  AUDIO_TYPE: AudioType.PannerNode,
  DISTANCE_MODEL: DistanceModelType.Inverse,
  ROLLOFF_FACTOR: 5,
  REF_DISTANCE: 8,
  MAX_DISTANCE: 10000,
  INNER_ANGLE: 170,
  OUTER_ANGLE: 300,
  OUTER_GAIN: 0.3,
  VOLUME: 1.0
});

export const GAIN_TIME_CONST = 0.2;

AFRAME.registerComponent("audio-params", {
  multiple: true,
  schema: {
    enabled: { default: true },
    debuggable: { default: true },
    audioType: { default: AvatarAudioDefaults.AUDIO_TYPE },
    distanceModel: { default: AvatarAudioDefaults.DISTANCE_MODEL, oneOf: [DISTANCE_MODEL_OPTIONS] },
    rolloffFactor: { default: AvatarAudioDefaults.ROLLOFF_FACTOR },
    refDistance: { default: AvatarAudioDefaults.REF_DISTANCE },
    maxDistance: { default: AvatarAudioDefaults.MAX_DISTANCE },
    coneInnerAngle: { default: AvatarAudioDefaults.INNER_ANGLE },
    coneOuterAngle: { default: AvatarAudioDefaults.OUTER_ANGLE },
    coneOuterGain: { default: AvatarAudioDefaults.OUTER_GAIN },
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
    this.audioSettings = this.el.sceneEl.systems["hubs-systems"].audioSettingsSystem.audioSettings;

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
      if (this.data.audioType === AudioType.PannerNode) {
        this.audioRef.setDistanceModel(this.data.distanceModel);
        this.audioRef.setRolloffFactor(this.data.rolloffFactor);
        this.audioRef.setRefDistance(this.data.refDistance);
        this.audioRef.setMaxDistance(this.data.maxDistance);
        this.audioRef.panner.coneInnerAngle = this.data.coneInnerAngle;
        this.audioRef.panner.coneOuterAngle = this.data.coneOuterAngle;
        this.audioRef.panner.coneOuterGain = this.data.coneOuterGain;
      }
      this.data.gain !== undefined && this.updateGain(this.data.gain);
    }
  },

  tick() {
    if (this.audioRef) {
      if (!this.audioRef.panner) {
        this.data.rolloffFactor = 0;
      }
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
