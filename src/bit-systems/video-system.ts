import {
  addComponent,
  defineComponent,
  defineQuery,
  enterQuery,
  entityExists,
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
  MediaLoaded,
  MediaRoot,
  MediaVideo,
  MediaVideoData,
  MediaVideoUpdated,
  Networked,
  NetworkedVideo,
  Owned
} from "../bit-components";
import { SourceType } from "../components/audio-params";
import { AudioSystem } from "../systems/audio-system";
import { findAncestorWithComponent, findChildWithComponent } from "../utils/bit-utils";
import { Emitter2Audio, Emitter2Params, makeAudioEntity, swapAudioSrc } from "./audio-emitter-system";
import { takeSoftOwnership } from "../utils/take-soft-ownership";
import { crNextFrame } from "../utils/coroutine";
import { ClearFunction, JobRunner, swapObject3DComponent } from "../hubs";
import { VIDEO_FLAGS } from "../inflators/video";
import { HubsVideoTexture } from "../textures/HubsVideoTexture";
import { create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { loadAudioTexture } from "../utils/load-audio-texture";
import { loadVideoTexture } from "../utils/load-video-texture";
import { resolveMediaInfo, MediaType } from "../utils/media-utils";
import { EntityID } from "../utils/networking-types";
import { ProjectionModeName, getProjectionNameFromProjection } from "../utils/projection-mode";
import { disposeNode } from "../utils/three-utils";
import { MediaInfo } from "./media-loading";

export const MediaVideoUpdateSrcEvent = defineComponent();

function* loadSrc(
  world: HubsWorld,
  eid: EntityID,
  src: string,
  oldVideo: HTMLVideoElement,
  clearRollbacks: ClearFunction
) {
  const projection = getProjectionNameFromProjection(NetworkedVideo.projection[eid]);
  const autoPlay = NetworkedVideo.flags[eid] & VIDEO_FLAGS.AUTO_PLAY ? true : false;
  const loop = NetworkedVideo.flags[eid] & VIDEO_FLAGS.LOOP ? true : false;
  const { accessibleUrl, contentType, mediaType } = (yield resolveMediaInfo(src)) as MediaInfo;
  let data: any;
  if (mediaType === MediaType.VIDEO) {
    data = (yield loadVideoTexture(accessibleUrl, contentType, loop, autoPlay)) as unknown;
  } else if (mediaType === MediaType.AUDIO) {
    data = (yield loadAudioTexture(accessibleUrl, loop, autoPlay)) as unknown;
  } else {
    return;
  }

  const { texture, ratio, video }: { texture: HubsVideoTexture; ratio: number; video: HTMLVideoElement } = data;

  clearRollbacks(); // After this point, normal entity cleanup will take care of things

  let videoObj;
  if (projection === ProjectionModeName.SPHERE_EQUIRECTANGULAR) {
    videoObj = create360ImageMesh(texture, ratio);
  } else {
    videoObj = createImageMesh(texture, ratio);
  }
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

  if ((NetworkedVideo.flags[eid] & VIDEO_FLAGS.PAUSED) === 0 || autoPlay) {
    video.play();
  }

  removeComponent(world, MediaVideoUpdateSrcEvent, eid);
}

enum Flags {
  PAUSED = 1 << 0
}

export function updateVideoSrc(world: HubsWorld, eid: EntityID, src: string, video: HTMLVideoElement) {
  addComponent(world, MediaVideoUpdateSrcEvent, eid);

  jobs.stop(eid);
  jobs.add(eid, clearRollbacks => loadSrc(world, eid, src, video, clearRollbacks));
}

const jobs = new JobRunner();
export const OUT_OF_SYNC_SEC = 5;
const networkedVideoQuery = defineQuery([Networked, NetworkedVideo]);
const networkedVideoEnterQuery = enterQuery(networkedVideoQuery);
const mediaVideoQuery = defineQuery([MediaVideo]);
const mediaVideoEnterQuery = enterQuery(mediaVideoQuery);
const networkedVideoExitQuery = exitQuery(networkedVideoQuery);
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
      const now = performance.now();
      if (now - MediaVideo.lastUpdate[eid] > 1000) {
        NetworkedVideo.time[eid] = video.currentTime;
        MediaVideo.lastUpdate[eid] = now;
      }
      let flags = NetworkedVideo.flags[eid];
      if (video.paused) {
        flags |= VIDEO_FLAGS.PAUSED;
      } else {
        flags &= ~VIDEO_FLAGS.PAUSED;
      }
      if (video.loop) {
        flags |= VIDEO_FLAGS.LOOP;
      } else {
        flags &= ~VIDEO_FLAGS.LOOP;
      }
      if (video.autoplay) {
        flags |= VIDEO_FLAGS.AUTO_PLAY;
      } else {
        flags &= ~VIDEO_FLAGS.AUTO_PLAY;
      }
      NetworkedVideo.flags[eid] = flags;
      NetworkedVideo.src[eid] = APP.getSid(video.src);
    } else {
      let shouldUpdateVideo = false;
      const autoPlay = NetworkedVideo.flags[eid] & VIDEO_FLAGS.AUTO_PLAY ? true : false;
      const loop = NetworkedVideo.flags[eid] & VIDEO_FLAGS.AUTO_PLAY ? true : false;
      if (MediaVideo.flags[eid] !== NetworkedVideo.flags[eid]) {
        MediaVideo.flags[eid] = NetworkedVideo.flags[eid];
      }
      if (MediaVideo.projection[eid] !== NetworkedVideo.projection[eid]) {
        MediaVideo.projection[eid] = NetworkedVideo.projection[eid];
        shouldUpdateVideo ||= true;
      }
      const src = APP.getString(NetworkedVideo.src[eid])!;
      shouldUpdateVideo ||= src !== video.src || autoPlay !== video.autoplay || loop !== video.loop;
      if (shouldUpdateVideo && !hasComponent(world, MediaVideoUpdateSrcEvent, eid)) {
        updateVideoSrc(world, eid, src, video);
      }
      const networkedPauseState = !!(NetworkedVideo.flags[eid] & VIDEO_FLAGS.PAUSED);
      if (networkedPauseState !== video.paused) {
        video.paused
          ? video.play().catch(() => {
              // Need to deal with the fact play() may fail if user has not interacted with browser yet.
              console.error("Error playing video.");
            })
          : video.pause();
        addComponent(world, MediaVideoUpdated, eid);
      }
      if (networkedPauseState || Math.abs(NetworkedVideo.time[eid] - video.currentTime) > OUT_OF_SYNC_SEC) {
        video.currentTime = NetworkedVideo.time[eid];
        addComponent(world, MediaVideoUpdated, eid);
      }
    }
  });
  mediaVideoQuery(world).forEach(eid => {
    // We need to delay this a frame to give a chance to other services to process this event
    crNextFrame().then(() => {
      if (entityExists(world, eid)) {
        removeComponent(world, MediaVideoUpdated, eid);
      }
    });
  });

  jobs.tick();
}
