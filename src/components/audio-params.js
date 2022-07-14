// TODO: Reintroduce audio normalization
// import { AudioNormalizer } from "../utils/audio-normalizer";

export const DISTANCE_MODEL_OPTIONS = ["linear", "inverse", "exponential"];

export const SourceType = Object.freeze({
  MEDIA_VIDEO: 0,
  AVATAR_AUDIO_SOURCE: 1,
  SFX: 2,
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
  audioType: AudioType.PannerNode,
  distanceModel: DistanceModelType.Inverse,
  rolloffFactor: 5,
  refDistance: 5,
  maxDistance: 10000,
  coneInnerAngle: 180,
  coneOuterAngle: 360,
  coneOuterGain: 0.9,
  gain: 1.0
});

export const MediaAudioDefaults = Object.freeze({
  audioType: AudioType.PannerNode,
  distanceModel: DistanceModelType.Inverse,
  rolloffFactor: 5,
  refDistance: 5,
  maxDistance: 10000,
  coneInnerAngle: 360,
  coneOuterAngle: 0,
  coneOuterGain: 0.9,
  gain: 0.5
});

export const TargetAudioDefaults = Object.freeze({
  audioType: AudioType.PannerNode,
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
