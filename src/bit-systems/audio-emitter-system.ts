import { addComponent, addEntity, defineQuery, enterQuery, removeComponent } from "bitecs";
import { PositionalAudio, Audio as StereoAudio, AudioListener as ThreeAudioListener } from "three";
import { HubsWorld } from "../app";
import { AudioEmitter, AudioSettingsChanged, MediaVideoData } from "../bit-components";
import { AudioType, SourceType } from "../components/audio-params";
import { AudioSystem } from "../systems/audio-system";
import { applySettings, getCurrentAudioSettings, updateAudioSettings } from "../update-audio-settings";
import { addObject3DComponent, swapObject3DComponent } from "../utils/jsx-entity";

export type AudioObject3D = StereoAudio | PositionalAudio;
type AudioConstructor<T> = new (listener: ThreeAudioListener) => T;

export const Emitter2Audio = (AudioEmitter as any).audios as Map<number, number>;
export const Emitter2Params = (AudioEmitter as any).params as Map<number, number>;

export function isPositionalAudio(node: AudioObject3D): node is PositionalAudio {
  return (node as any).panner !== undefined;
}

export function cleanupAudio(audio: AudioObject3D) {
  const eid = audio.eid!;
  if (audio.source !== null) {
    audio.disconnect();
  }
  const audioSystem = APP.scene?.systems["hubs-systems"].audioSystem;
  APP.audios.delete(eid);
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
  if (audio.source !== null) {
    audio.disconnect();
  }
  APP.sourceType.set(eid, SourceType.MEDIA_VIDEO);
  APP.supplementaryAttenuation.delete(eid);
  APP.audios.delete(eid);
  audioSystem.removeAudio({ node: audio });

  const newAudio = new NewType(APP.audioListener);
  newAudio.setNodeSource(audio.source!);
  audioSystem.addAudio({ sourceType: SourceType.MEDIA_VIDEO, node: newAudio });
  APP.audios.set(eid, newAudio);

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
    const video = MediaVideoData.get(source)!;
    if (video.paused) {
      APP.isAudioPaused.add(eid);
    } else {
      APP.isAudioPaused.delete(eid);
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

  APP.audios.set(eid, audio);
  updateAudioSettings(eid, audio);

  return eid;
}

const staleAudioEmittersQuery = defineQuery([AudioEmitter, AudioSettingsChanged]);
const audioEmitterQuery = defineQuery([AudioEmitter]);
const audioEmitterEnterQuery = enterQuery(audioEmitterQuery);
export function audioEmitterSystem(world: HubsWorld, audioSystem: AudioSystem) {
  audioEmitterEnterQuery(world).forEach(eid => {
    const audio = APP.audios.get(eid)!;
    audio.updateMatrixWorld(true);
  });
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
