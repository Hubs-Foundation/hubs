import { addComponent, addEntity, defineQuery, removeComponent } from "bitecs";
import {
  PositionalAudio,
  Audio as StereoAudio,
  AudioListener as ThreeAudioListener,
  MeshStandardMaterial,
  Mesh
} from "three";
import { HubsWorld } from "../app";
import { AudioEmitter, AudioSettingsChanged } from "../bit-components";
import {
  AudioSettings,
  AudioType,
  MediaAudioDefaults,
  PanningModelType,
  SfxAudioDefaults,
  SourceType,
  TargetAudioDefaults,
  ZoneAudioDefaults
} from "../components/audio-params";
import { AudioSystem } from "../systems/audio-system";
import { addObject3DComponent, swapObject3DComponent } from "../utils/jsx-entity";

export type AudioObject3D = StereoAudio | PositionalAudio;
type AudioConstructor<T> = new (listener: ThreeAudioListener) => T;

export const Emitter2Audio = (AudioEmitter as any).audios as Map<number, number>;
export const Emitter2Params = (AudioEmitter as any).params as Map<number, number>;

export const EMITTER_FLAGS = {
  MUTED: 1 << 0,
  PAUSED: 1 << 1,
  CLIPPED: 1 << 2
};

export function isPositionalAudio(node: AudioObject3D): node is PositionalAudio {
  return (node as any).panner !== undefined;
}

const SourceTypeToAudioParams = {
  [SourceType.MEDIA_VIDEO]: MediaAudioDefaults,
  [SourceType.AVATAR_AUDIO_SOURCE]: MediaAudioDefaults,
  [SourceType.AUDIO_TARGET]: TargetAudioDefaults,
  [SourceType.AUDIO_ZONE]: ZoneAudioDefaults,
  [SourceType.SFX]: SfxAudioDefaults
};

const getOverriddenPanningModelType = () => {
  switch (APP.store.state.preferences.audioPanningQuality) {
    case "High":
      return PanningModelType.HRTF;
    case "Low":
      return PanningModelType.EqualPower;
    default:
      return null;
  }
};

const getCurrentAudioSettings = (eid: number) => {
  const sourceType = APP.sourceType.get(eid)!;
  const defaults = SourceTypeToAudioParams[sourceType];
  const sceneOverrides = APP.sceneAudioDefaults.get(sourceType);
  const audioOverrides = APP.audioOverrides.get(eid);
  const audioDebugPanelOverrides = APP.audioDebugPanelOverrides.get(sourceType);
  const zoneSettings = APP.zoneOverrides.get(eid);
  const preferencesOverrides = {} as AudioSettings;

  const overriddenPanningModelType = getOverriddenPanningModelType();

  if (overriddenPanningModelType !== null) {
    preferencesOverrides.panningModel = overriddenPanningModelType;
  }

  if (APP.store.state.preferences.disableLeftRightPanning) {
    preferencesOverrides.audioType = AudioType.Stereo;
  }

  const settings = Object.assign(
    {},
    defaults,
    sceneOverrides,
    audioOverrides,
    audioDebugPanelOverrides,
    zoneSettings,
    preferencesOverrides
  );

  // TODO Handle voice permissions
  if (AudioEmitter.flags[eid] & EMITTER_FLAGS.CLIPPED || AudioEmitter.flags[eid] & EMITTER_FLAGS.MUTED) {
    settings.gain = 0;
  } else if (APP.gainMultipliers.has(eid)) {
    settings.gain = settings.gain * APP.gainMultipliers.get(eid)!;
  }

  if (APP.supplementaryAttenuation.has(eid)) {
    settings.gain = settings.gain * APP.supplementaryAttenuation.get(eid)!;
  }

  return settings;
};

const applySettings = (audio: AudioObject3D, settings: AudioSettings) => {
  if (audio instanceof PositionalAudio) {
    audio.setDistanceModel(settings.distanceModel);
    audio.setRolloffFactor(settings.rolloffFactor);
    audio.setRefDistance(settings.refDistance);
    audio.setMaxDistance(settings.maxDistance);
    audio.panner.panningModel = settings.panningModel;
    audio.panner.coneInnerAngle = settings.coneInnerAngle;
    audio.panner.coneOuterAngle = settings.coneOuterAngle;
    audio.panner.coneOuterGain = settings.coneOuterGain;
  }
  audio.gain.gain.setTargetAtTime(settings.gain, audio.context.currentTime, 0.1);
};

export function cleanupAudio(audio: AudioObject3D) {
  const eid = audio.eid!;
  audio.disconnect();
  const audioSystem = APP.scene?.systems["hubs-systems"].audioSystem;
  APP.supplementaryAttenuation.delete(eid);
  APP.audioOverrides.delete(eid);
  audioSystem.removeAudio({ node: audio });
}

function swapAudioType<T extends AudioObject3D>(
  world: HubsWorld,
  audioSystem: AudioSystem,
  eid: number,
  NewType: AudioConstructor<T>
) {
  const audio = world.eid2obj.get(eid)! as AudioObject3D;
  audio.disconnect();
  APP.sourceType.set(eid, SourceType.MEDIA_VIDEO);
  APP.supplementaryAttenuation.delete(eid);
  audioSystem.removeAudio({ node: audio });

  const newAudio = new NewType(APP.audioListener);
  newAudio.setNodeSource(audio.source!);
  audioSystem.addAudio({ sourceType: SourceType.MEDIA_VIDEO, node: newAudio });

  audio.parent!.add(newAudio);
  audio.removeFromParent();

  swapObject3DComponent(world, eid, newAudio);
}

export function makeAudioEntity(world: HubsWorld, source: number, sourceType: SourceType, audioSystem: AudioSystem) {
  const eid = addEntity(world);
  APP.sourceType.set(eid, sourceType);

  let audio;
  const { audioType } = getCurrentAudioSettings(eid);
  const audioListener = APP.audioListener;
  if (audioType === AudioType.PannerNode) {
    audio = new PositionalAudio(audioListener);
  } else {
    audio = new StereoAudio(audioListener);
  }

  if (sourceType === SourceType.MEDIA_VIDEO) {
    const videoObj = world.eid2obj.get(source) as Mesh;
    const video = (videoObj.material as MeshStandardMaterial).map!.image as HTMLVideoElement;
    if (video.paused) {
      AudioEmitter.flags[eid] |= EMITTER_FLAGS.PAUSED;
    } else {
      AudioEmitter.flags[eid] &= ~EMITTER_FLAGS.PAUSED;
    }
    const audioSrcEl = video;
    audio.setMediaElementSource(audioSrcEl);
    // Original audio source volume can now be restored as audio systems will take over
    audioSrcEl.volume = 1;
    audio.gain.gain.value = 0;
  }

  addComponent(world, AudioEmitter, eid);
  addObject3DComponent(world, eid, audio);

  audioSystem.addAudio({ sourceType, node: audio });

  addComponent(world, AudioSettingsChanged, eid);

  return eid;
}

const staleAudioEmittersQuery = defineQuery([AudioEmitter, AudioSettingsChanged]);
export function audioEmitterSystem(world: HubsWorld, audioSystem: AudioSystem) {
  staleAudioEmittersQuery(world).forEach(function (eid) {
    const audio = world.eid2obj.get(eid)! as PositionalAudio | StereoAudio;
    const settings = getCurrentAudioSettings(eid);
    const isPannerNode = isPositionalAudio(audio);

    // TODO this needs more testing
    if (!isPannerNode && settings.audioType === AudioType.PannerNode) {
      swapAudioType(world, audioSystem, eid, PositionalAudio);
    } else if (isPannerNode && settings.audioType === AudioType.Stereo) {
      swapAudioType(world, audioSystem, eid, StereoAudio);
    }

    applySettings(audio, settings);
    removeComponent(world, AudioSettingsChanged, eid);
  });
}
