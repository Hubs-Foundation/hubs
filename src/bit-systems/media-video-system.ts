import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { MediaVideo, NetworkedVideo, Owned } from "../bit-components";

enum Flags {
  PAUSED = 1 << 0
}

const OUT_OF_SYNC_SEC = 5;
const networkedVideoQuery = defineQuery([NetworkedVideo]);
const mediaVideoQuery = defineQuery([MediaVideo]);
const mediaVideoEnterQuery = enterQuery(mediaVideoQuery);
export function mediaVideoSystem(world: HubsWorld) {
  mediaVideoEnterQuery(world).forEach(function (eid) {
    if (MediaVideo.autoPlay[eid]) {
      const video = (world.eid2obj.get(eid) as any).material.map.image as HTMLVideoElement;
      video.play().catch(() => {
        // Need to deal with the fact play() may fail if user has not interacted with browser yet.
        console.error("Error auto-playing video.");
      });
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
