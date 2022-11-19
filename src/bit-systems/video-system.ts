import { addComponent, addEntity, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent } from "bitecs";
import {
  PositionalAudio,
  Audio as StereoAudio,
  Mesh,
  MeshStandardMaterial,
  AudioListener as ThreeAudioListener
} from "three";
import { HubsWorld } from "../app";
import { AudioEmitter, AudioSettingsChanged, MediaVideo, NetworkedVideo, Owned } from "../bit-components";
import { AudioType, SourceType } from "../components/audio-params";
import { AudioSystem } from "../systems/audio-system";
import { applySettings, getCurrentAudioSettings, updateAudioSettings } from "../update-audio-settings";
import { addObject3DComponent, swapObject3DComponent } from "../utils/jsx-entity";

type AudioObject3D = StereoAudio | PositionalAudio;
type AudioConstructor<T> = new (listener: ThreeAudioListener) => T;

enum Flags {
  PAUSED = 1 << 0
}

function makeAudioSourceEntity(world: HubsWorld, video: HTMLVideoElement, audioSystem: AudioSystem) {
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

// TODO this can live outside of video system
const staleAudioEmittersQuery = defineQuery([AudioEmitter, AudioSettingsChanged]);
function audioEmitterSystem(world: HubsWorld, audioSystem: AudioSystem) {
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

const OUT_OF_SYNC_SEC = 5;
const networkedVideoQuery = defineQuery([NetworkedVideo]);
const mediaVideoQuery = defineQuery([MediaVideo]);
const mediaVideoEnterQuery = enterQuery(mediaVideoQuery);
export function videoSystem(world: HubsWorld, audioSystem: AudioSystem) {
  mediaVideoEnterQuery(world).forEach(function (eid) {
    const videoObj = world.eid2obj.get(eid) as Mesh;
    const video = (videoObj.material as MeshStandardMaterial).map!.image as HTMLVideoElement;
    if (MediaVideo.autoPlay[eid]) {
      video.play().catch(() => {
        // Need to deal with the fact play() may fail if user has not interacted with browser yet.
        console.error("Error auto-playing video.");
      });
    }
    const audio = world.eid2obj.get(makeAudioSourceEntity(world, video, audioSystem))!;
    videoObj.add(audio);
    // Note in media-video we call updateMatrixWorld here to force PositionalAudio's updateMatrixWorld to run even
    // if it has an invisible parent. We don't want to have invisible parents now.
  });

  audioEmitterSystem(world, audioSystem);

  networkedVideoQuery(world).forEach(function (eid) {
    const video = (world.eid2obj.get(eid) as any).material.map.image as HTMLVideoElement;
    if (hasComponent(world, Owned, eid)) {
      NetworkedVideo.time[eid] = video.currentTime;
      let flags = 0;
      flags |= video.paused ? Flags.PAUSED : 0;
      NetworkedVideo.flags[eid] = flags;
    } else {
      const networkedPauseState = !!(NetworkedVideo.flags[eid] & Flags.PAUSED);
      if (networkedPauseState !== video.paused) {
        video.paused ? video.play() : video.pause();
      }
      if (networkedPauseState || Math.abs(NetworkedVideo.time[eid] - video.currentTime) > OUT_OF_SYNC_SEC) {
        video.currentTime = NetworkedVideo.time[eid];
      }
    }
  });
}
