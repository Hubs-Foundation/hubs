import { defineQuery, enterQuery, hasComponent } from "bitecs";
import { Mesh, MeshStandardMaterial } from "three";
import { HubsWorld } from "../app";
import { MediaVideo, NetworkedVideo, Owned } from "../bit-components";
import { AudioSystem } from "../systems/audio-system";
import { makeAudioSourceEntity } from "./audio-emitter-system";

enum Flags {
  PAUSED = 1 << 0
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
