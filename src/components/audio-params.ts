// TODO: Reintroduce audio normalization
// import { AudioNormalizer } from "../utils/audio-normalizer";

export const DISTANCE_MODEL_OPTIONS = ["linear", "inverse", "exponential"];

export enum SourceType {
  MEDIA_VIDEO = 0,
  AVATAR_AUDIO_SOURCE = 1,
  SFX = 2,
  AUDIO_TARGET = 3,
  AUDIO_ZONE = 4
}

export enum AudioType {
  Stereo = "stereo",
  PannerNode = "pannernode"
}

export enum DistanceModelType {
  Linear = "linear",
  Inverse = "inverse",
  Exponential = "exponential"
}

export enum PanningModelType {
  HRTF = "HRTF",
  EqualPower = "equalpower"
}

export interface SceneAudioSettings {
  avatarDistanceModel: DistanceModelType;
  avatarRolloffFactor: number;
  avatarRefDistance: number;
  avatarMaxDistance: number;
  mediaDistanceModel: DistanceModelType;
  mediaRolloffFactor: number;
  mediaRefDistance: number;
  mediaMaxDistance: number;
  mediaConeInnerAngle: number;
  mediaConeOuterAngle: number;
  mediaConeOuterGain: number;
  mediaVolume: number;
}

export interface AudioSettings {
  audioType: AudioType;
  distanceModel: DistanceModelType;
  panningModel: PanningModelType;
  rolloffFactor: number;
  refDistance: number;
  maxDistance: number;
  coneInnerAngle: number;
  coneOuterAngle: number;
  coneOuterGain: number;
  gain: number;
}

export const AvatarAudioDefaults: AudioSettings = {
  audioType: AudioType.PannerNode,
  distanceModel: DistanceModelType.Inverse,
  panningModel: PanningModelType.HRTF,
  rolloffFactor: 5,
  refDistance: 5,
  maxDistance: 10000,
  coneInnerAngle: 180,
  coneOuterAngle: 360,
  coneOuterGain: 0.9,
  gain: 1.0
};

export const MediaAudioDefaults: AudioSettings = {
  audioType: AudioType.PannerNode,
  distanceModel: DistanceModelType.Inverse,
  panningModel: PanningModelType.HRTF,
  rolloffFactor: 5,
  refDistance: 5,
  maxDistance: 10000,
  coneInnerAngle: 360,
  coneOuterAngle: 0,
  coneOuterGain: 0.9,
  gain: 0.5
};

export const TargetAudioDefaults: AudioSettings = {
  audioType: AudioType.PannerNode,
  distanceModel: DistanceModelType.Inverse,
  panningModel: PanningModelType.HRTF,
  rolloffFactor: 5,
  refDistance: 8,
  maxDistance: 10000,
  coneInnerAngle: 170,
  coneOuterAngle: 300,
  coneOuterGain: 0.3,
  gain: 1.0
};

export const GAIN_TIME_CONST = 0.2;
