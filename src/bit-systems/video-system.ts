import { defineQuery, enterQuery, exitQuery, hasComponent, removeComponent } from "bitecs";
import { Mesh, MeshStandardMaterial } from "three";
import { HubsWorld } from "../app";
import { MediaVideo, MediaVideoPlaybackChanged, NetworkedVideo, Owned } from "../bit-components";
import { AudioSystem } from "../systems/audio-system";
import { makeAudioSourceEntity } from "./audio-emitter-system";

enum Flags {
  PAUSED = 1 << 0
}

const video2audio = new Map<number, number>();

const OUT_OF_SYNC_SEC = 5;
const networkedVideoQuery = defineQuery([NetworkedVideo]);
const mediaVideoQuery = defineQuery([MediaVideo]);
const mediaVideoEnterQuery = enterQuery(mediaVideoQuery);
const mediaVideoExitQuery = exitQuery(mediaVideoQuery);
const mediaPlaybackUpdated = defineQuery([MediaVideo, MediaVideoPlaybackChanged]);
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
    const audioEid = makeAudioSourceEntity(world, video, audioSystem);
    video2audio.set(videoEid, audioEid);
    const audio = world.eid2obj.get(audioEid)!;
    videoObj.add(audio);
    // Note in media-video we call updateMatrixWorld here to force PositionalAudio's updateMatrixWorld to run even
    // if it has an invisible parent. We don't want to have invisible parents now.
  });
  mediaVideoExitQuery(world).forEach(videoEid => {
    video2audio.delete(videoEid);
  });
  mediaPlaybackUpdated(world).forEach(videoEid => {
    const audio = video2audio.get(videoEid)!;
    const videoEl = (world.eid2obj.get(videoEid) as any).material.map.image as HTMLVideoElement;
    if (videoEl.paused) {
      APP.isAudioPaused.add(audio);
    } else {
      APP.isAudioPaused.delete(audio);
    }
    removeComponent(world, MediaVideoPlaybackChanged, videoEid);
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
