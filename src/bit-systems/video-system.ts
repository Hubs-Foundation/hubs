import { addComponent, defineQuery, enterQuery, entityExists, exitQuery, hasComponent, removeComponent } from "bitecs";
import { Mesh } from "three";
import { HubsWorld } from "../app";
import {
  AudioParams,
  AudioSettingsChanged,
  MediaLoaded,
  MediaVideo,
  MediaVideoData,
  MediaVideoUpdated,
  Networked,
  NetworkedVideo,
  Owned
} from "../bit-components";
import { SourceType } from "../components/audio-params";
import { AudioSystem } from "../systems/audio-system";
import { findAncestorWithComponent } from "../utils/bit-utils";
import { Emitter2Audio, Emitter2Params, makeAudioEntity } from "./audio-emitter-system";
import { takeSoftOwnership } from "../utils/take-soft-ownership";
import { crNextFrame } from "../utils/coroutine";

enum Flags {
  PAUSED = 1 << 0
}

export const OUT_OF_SYNC_SEC = 5;
const networkedVideoQuery = defineQuery([Networked, NetworkedVideo]);
const networkedVideoEnterQuery = enterQuery(networkedVideoQuery);
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

  networkedVideoQuery(world).forEach(function (eid) {
    const video = MediaVideoData.get(eid)!;
    if (hasComponent(world, Owned, eid)) {
      const now = performance.now();
      if (now - MediaVideo.lastUpdate[eid] > 1000) {
        NetworkedVideo.time[eid] = video.currentTime;
        MediaVideo.lastUpdate[eid] = now;
      }
      let flags = 0;
      flags |= video.paused ? Flags.PAUSED : 0;
      NetworkedVideo.flags[eid] = flags;
    } else {
      const networkedPauseState = !!(NetworkedVideo.flags[eid] & Flags.PAUSED);
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
}
