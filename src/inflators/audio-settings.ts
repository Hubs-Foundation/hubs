import { HubsWorld } from "../app";
import { AvatarAudioDefaults, MediaAudioDefaults, SceneAudioSettings, SourceType } from "../components/audio-params";

export function inflateAudioSettings(world: HubsWorld, eid: number, params: SceneAudioSettings) {
  const avatarParams = Object.assign({}, AvatarAudioDefaults, {
    distanceModel: params.avatarDistanceModel,
    rolloffFactor: params.avatarRolloffFactor,
    refDistance: params.avatarRefDistance,
    maxDistance: params.avatarMaxDistance
  });
  const mediaParams = Object.assign({}, MediaAudioDefaults, {
    distanceModel: params.mediaDistanceModel,
    rolloffFactor: params.mediaRolloffFactor,
    refDistance: params.mediaRefDistance,
    maxDistance: params.mediaMaxDistance,
    coneInnerAngle: params.mediaConeInnerAngle,
    coneOuterAngle: params.mediaConeOuterAngle,
    coneOuterGain: params.mediaConeOuterGain,
    gain: params.mediaVolume
  });
  APP.sceneAudioDefaults.set(SourceType.MEDIA_VIDEO, mediaParams);
  APP.sceneAudioDefaults.set(SourceType.AVATAR_AUDIO_SOURCE, avatarParams);
}
