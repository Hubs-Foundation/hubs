import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Interacted, MediaVideo, NetworkedVideo, Owned } from "../bit-components";
import { takeOwnership } from "../systems/netcode";

function clicked(eid: number) {
  return hasComponent(APP.world, Interacted, eid);
}

const OUT_OF_SYNC_SEC = 5;
const mediaVideoQuery = defineQuery([MediaVideo]);
const mediaVideoEnterQuery = enterQuery(mediaVideoQuery);
const mediaVideoExitQuery = exitQuery(mediaVideoQuery);
export function mediaVideoSystem(world: HubsWorld) {
  mediaVideoEnterQuery(world).forEach(function (eid) {
    if (MediaVideo.autoPlay[eid]) {
      const video = (world.eid2obj.get(eid) as any).material.map.image as HTMLVideoElement;
      // const video = ((world.eid2obj.get(eid)! as Mesh).material as MeshStandardMaterial)!.map!.image;

      // Need to deal with the fact play() may fail if user has not interacted with browser yet.
      video.play().catch(() => {
        console.error("Not allowed! You did a bad thing.");
      });
    }
  });

  mediaVideoExitQuery(world).forEach(function (eid) {
    //
  });

  mediaVideoQuery(world).forEach(function (eid) {
    const video = (world.eid2obj.get(eid) as any).material.map.image as HTMLVideoElement;
    if (hasComponent(world, Owned, eid)) {
      NetworkedVideo.time[eid] = video.currentTime;
    } else {
      if (Math.abs(NetworkedVideo.time[eid] - video.currentTime) > OUT_OF_SYNC_SEC) {
        video.currentTime = NetworkedVideo.time[eid];
      }
    }

    if (clicked(MediaVideo.playButtonRef[eid])) {
      takeOwnership(world, eid);
      video.paused ? video.play() : video.pause();
    }

    // TODO :
    // - seek forward
    // - seek back
    // - drag seek
    // - volume up
    // - volume down
    // - drag volume
    // - volume (mousewheel)
    //
    //  Separate the "active video menu" from this object
  });
}
