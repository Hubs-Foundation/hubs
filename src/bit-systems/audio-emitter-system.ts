import { addComponent, addEntity, defineQuery, removeComponent } from "bitecs";
import { PositionalAudio, Audio as StereoAudio, AudioListener as ThreeAudioListener } from "three";
import { HubsWorld } from "../app";
import { AudioEmitter, AudioSettingsChanged } from "../bit-components";
import { AudioType, SourceType } from "../components/audio-params";
import { AudioSystem } from "../systems/audio-system";
import { applySettings, getCurrentAudioSettings, updateAudioSettings } from "../update-audio-settings";
import { addObject3DComponent, swapObject3DComponent } from "../utils/jsx-entity";

type AudioObject3D = StereoAudio | PositionalAudio;
type AudioConstructor<T> = new (listener: ThreeAudioListener) => T;

function isPositionalAudio(node: AudioObject3D): node is PositionalAudio {
  return (node as any).panner !== undefined;
}

function swapAudioType<T extends AudioObject3D>(
  world: HubsWorld,
  audioSystem: AudioSystem,
  eid: number,
  NewType: AudioConstructor<T>
) {
  const audio = world.eid2obj.get(eid)! as AudioObject3D;
  audio.disconnect();
  audioSystem.removeAudio({ node: audio });

  const newAudio = new NewType(APP.audioListener);
  newAudio.setNodeSource(audio.source!);
  audioSystem.addAudio({ sourceType: SourceType.MEDIA_VIDEO, node: newAudio });
  APP.audios.set(eid, newAudio);

  audio.parent!.add(newAudio);
  audio.removeFromParent();

  swapObject3DComponent(world, eid, newAudio);
}

export function makeAudioSourceEntity(world: HubsWorld, video: HTMLVideoElement, audioSystem: AudioSystem) {
  const eid = addEntity(world);
  APP.sourceType.set(eid, SourceType.MEDIA_VIDEO);
  if (video.paused) {
    APP.isAudioPaused.add(eid);
  } else {
    APP.isAudioPaused.delete(eid);
  }

  let audio;
  const { audioType } = getCurrentAudioSettings(eid);
  const audioListener = APP.audioListener;
  if (audioType === AudioType.PannerNode) {
    audio = new PositionalAudio(audioListener);
  } else {
    audio = new StereoAudio(audioListener);
  }
  addComponent(world, AudioEmitter, eid);
  addObject3DComponent(world, eid, audio);

  audio.gain.gain.value = 0;
  audioSystem.addAudio({ sourceType: SourceType.MEDIA_VIDEO, node: audio });

  const audioSrcEl = video;
  audio.setMediaElementSource(audioSrcEl);

  APP.audios.set(eid, audio);
  updateAudioSettings(eid, audio);

  // Original audio source volume can now be restored as audio systems will take over
  audioSrcEl.volume = 1;
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
