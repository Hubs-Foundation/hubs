import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { Mesh, MeshStandardMaterial } from "three";
import { HubsWorld } from "../app";
import {
  AudioParams,
  AudioSettingsChanged,
  MediaLoaded,
  MediaVideo,
  Networked,
  NetworkedVideo,
  Owned
} from "../bit-components";
import { SourceType } from "../components/audio-params";
import { AudioSystem } from "../systems/audio-system";
import { findAncestorWithComponent } from "../utils/bit-utils";
import { Emitter2Audio, Emitter2Params, makeAudioEntity } from "./audio-emitter-system";
import { takeSoftOwnership } from "../utils/take-soft-ownership";

enum Flags {
  PAUSED = 1 << 0
}

const OUT_OF_SYNC_SEC = 5;
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
    const video = (videoObj.material as MeshStandardMaterial).map!.image as HTMLVideoElement;
    if (MediaVideo.autoPlay[videoEid]) {
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
  });

  networkedVideoEnterQuery(world).forEach(function (eid) {
    if (Networked.owner[eid] === APP.getSid("reticulum")) {
      takeSoftOwnership(world, eid);
    }
  });

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
