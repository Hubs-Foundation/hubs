import { AudioNormalizer } from "../utils/audio-normalizer";

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
  gain: 1.0
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
  gain: 0.5
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
  gain: 1.0
});

export const GAIN_TIME_CONST = 0.2;

AFRAME.registerComponent("audio-params", {
  multiple: true,
  schema: {
    enabled: { default: true },
    debuggable: { default: true },
    audioType: { default: AvatarAudioDefaults.AUDIO_TYPE },
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
      sourceType
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
  }
});
