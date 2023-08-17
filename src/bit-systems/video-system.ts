import {
  addComponent,
  defineComponent,
  defineQuery,
  enterQuery,
  exitQuery,
  hasComponent,
  removeComponent
} from "bitecs";
import { Mesh } from "three";
import { HubsWorld } from "../app";
import {
  AudioEmitter,
  AudioParams,
  AudioSettingsChanged,
  EntityID,
  MediaLoaded,
  MediaRoot,
  MediaVideo,
  MediaVideoData,
  Networked,
  NetworkedVideo,
  Owned
} from "../bit-components";
import { SourceType } from "../components/audio-params";
import { AudioSystem } from "../systems/audio-system";
import { findAncestorWithComponent, findChildWithComponent } from "../utils/bit-utils";
import { Emitter2Audio, Emitter2Params, makeAudioEntity, swapAudioSrc } from "./audio-emitter-system";
import { takeSoftOwnership } from "../utils/take-soft-ownership";
import { disposeNode } from "../utils/three-utils";
import { HubsVideoTexture } from "../textures/HubsVideoTexture";
import { createImageMesh } from "../utils/create-image-mesh";
import { ClearFunction, JobRunner } from "../utils/coroutine-utils";
import { loadVideoTexture } from "../utils/load-video-texture";
import { resolveMediaInfo } from "../utils/media-utils";
import { swapObject3DComponent } from "../utils/jsx-entity";
import { MediaInfo } from "./media-loading";

export const MediaVideoUpdateSrcEvent = defineComponent();

enum Flags {
  PAUSED = 1 << 0
}

function* loadSrc(
  world: HubsWorld,
  eid: EntityID,
  src: string,
  oldVideo: HTMLVideoElement,
  clearRollbacks: ClearFunction
) {
  const { accessibleUrl, contentType } = (yield resolveMediaInfo(src)) as MediaInfo;
  const { texture, ratio, video }: { texture: HubsVideoTexture; ratio: number; video: HTMLVideoElement } =
    yield loadVideoTexture(accessibleUrl, contentType);

  clearRollbacks(); // After this point, normal entity cleanup will take care of things

  // TODO: Check the projection mode to allow EQUIRECT
  const videoObj = createImageMesh(texture, ratio);
  MediaVideo.ratio[eid] = ratio;
  MediaVideoData.set(eid, video);
  oldVideo.pause();

  const mediaRoot = findAncestorWithComponent(world, MediaRoot, eid)!;
  const mediaRootObj = world.eid2obj.get(mediaRoot)!;
  mediaRootObj.add(videoObj);

  const audioEmitter = findChildWithComponent(world, AudioEmitter, eid)!;
  swapAudioSrc(world, eid, audioEmitter);
  const audioObj = APP.world.eid2obj.get(audioEmitter)!;
  videoObj.add(audioObj);

  const oldVideoObj = APP.world.eid2obj.get(eid)! as Mesh;
  mediaRootObj.remove(oldVideoObj);
  disposeNode(oldVideoObj);

  swapObject3DComponent(world, eid, videoObj);

  if ((NetworkedVideo.flags[eid] & Flags.PAUSED) === 0) {
    video.play();
  }

  removeComponent(world, MediaVideoUpdateSrcEvent, eid);
}

export function updateVideoSrc(world: HubsWorld, eid: EntityID, src: string, video: HTMLVideoElement) {
  addComponent(world, MediaVideoUpdateSrcEvent, eid);

  jobs.stop(eid);
  jobs.add(eid, clearRollbacks => loadSrc(world, eid, src, video, clearRollbacks));
}

const jobs = new JobRunner();
const OUT_OF_SYNC_SEC = 5;
const networkedVideoQuery = defineQuery([Networked, NetworkedVideo]);
const networkedVideoEnterQuery = enterQuery(networkedVideoQuery);
const networkedVideoExitQuery = exitQuery(networkedVideoQuery);
const mediaVideoQuery = defineQuery([MediaVideo]);
const mediaVideoEnterQuery = enterQuery(mediaVideoQuery);
const mediaVideoExitQuery = exitQuery(mediaVideoQuery);
const mediaLoadStatusQuery = defineQuery([MediaVideo, MediaLoaded]);
const mediaLoadedQuery = enterQuery(mediaLoadStatusQuery);
export function videoSystem(world: HubsWorld, audioSystem: AudioSystem) {
  mediaVideoEnterQuery(world).forEach(function (videoEid) {
    const videoObj = world.eid2obj.get(videoEid) as Mesh;
    const video = MediaVideoData.get(videoEid)!;
    if (video.autoplay) {
      video.play().catch(() => {
        // Need to deal with the fact play() may fail if user has not interacted with browser yet.
        console.error("Error auto-playing video.");
      });
    }
    const audioEid = makeAudioEntity(world, videoEid, SourceType.MEDIA_VIDEO, audioSystem);
    Emitter2Audio.set(videoEid, audioEid);
    const audio = world.eid2obj.get(audioEid)!;
    videoObj.add(audio);
    // Note in media-video we call updateMatrixWorld here to force PositionalAudio's updateMatrixWorld to run even
    // if it has an invisible parent. We don't want to have invisible parents now.
  });
  mediaLoadedQuery(world).forEach(videoEid => {
    const audioParamsEid = findAncestorWithComponent(world, AudioParams, videoEid);
    if (audioParamsEid) {
      const audioSettings = APP.audioOverrides.get(audioParamsEid)!;
      const audioEid = Emitter2Audio.get(videoEid)!;
      APP.audioOverrides.set(audioEid, audioSettings);
      Emitter2Params.set(videoEid, audioParamsEid);
      addComponent(world, AudioSettingsChanged, audioEid);
    }
  });
  mediaVideoExitQuery(world).forEach(videoEid => {
    const audioParamsEid = Emitter2Params.get(videoEid);
    audioParamsEid && APP.audioOverrides.delete(audioParamsEid);
    Emitter2Params.delete(videoEid);
    Emitter2Audio.delete(videoEid);
    MediaVideoData.delete(videoEid);
  });

  networkedVideoEnterQuery(world).forEach(function (eid) {
    if (Networked.owner[eid] === APP.getSid("reticulum")) {
      takeSoftOwnership(world, eid);
    }
  });

  networkedVideoExitQuery(world).forEach(eid => {
    jobs.stop(eid);
  });

  networkedVideoQuery(world).forEach(function (eid) {
    const video = MediaVideoData.get(eid)!;
    if (hasComponent(world, Owned, eid)) {
      NetworkedVideo.time[eid] = video.currentTime;
      let flags = 0;
      flags |= video.paused ? Flags.PAUSED : 0;
      NetworkedVideo.flags[eid] = flags;
      NetworkedVideo.src[eid] = APP.getSid(video.src);
    } else {
      const networkedSrc = APP.getString(NetworkedVideo.src[eid])!;
      if (networkedSrc !== video.src && !hasComponent(world, MediaVideoUpdateSrcEvent, eid)) {
        updateVideoSrc(world, eid, networkedSrc, video);
      }
      const networkedPauseState = !!(NetworkedVideo.flags[eid] & Flags.PAUSED);
      if (networkedPauseState !== video.paused) {
        video.paused ? video.play() : video.pause();
      }
      if (networkedPauseState || Math.abs(NetworkedVideo.time[eid] - video.currentTime) > OUT_OF_SYNC_SEC) {
        video.currentTime = NetworkedVideo.time[eid];
      }
    }
  });

  jobs.tick();
}
