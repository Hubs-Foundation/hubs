import { defineQuery, enterQuery, exitQuery, hasComponent, removeComponent } from "bitecs";
import { HubsWorld } from "../app";
import {
  MirroredMedia,
  LinkedMedia,
  MediaVideo,
  NetworkedVideo,
  MediaVideoData,
  MediaVideoUpdated
} from "../bit-components";
import { findAncestorWithComponent, findChildWithComponent } from "../utils/bit-utils";
import { takeOwnership } from "../utils/take-ownership";
import { OUT_OF_SYNC_SEC } from "./video-system";
import { linkMedia } from "./linked-media-system";

const mediaVideoQuery = defineQuery([MediaVideo]);
const mediaVideoEnterQuery = enterQuery(mediaVideoQuery);
const mediaVideoExitQuery = exitQuery(mediaVideoQuery);
const updatedVideoQuery = defineQuery([MediaVideoUpdated]);
const updatedVideoEnterQuery = enterQuery(updatedVideoQuery);
export function linkedVideoSystem(world: HubsWorld) {
  mediaVideoEnterQuery(world).forEach(eid => {
    const mirroredMediaEid = findAncestorWithComponent(world, MirroredMedia, eid);
    if (mirroredMediaEid) {
      const mediaMirroredEid = MirroredMedia.linkedRef[mirroredMediaEid];
      const sourceMediaEid = findChildWithComponent(world, MediaVideo, mediaMirroredEid)!;
      if (sourceMediaEid) {
        linkMedia(world, eid, sourceMediaEid);
        const video = MediaVideoData.get(eid)!;
        const linkedVideo = MediaVideoData.get(sourceMediaEid)!;
        if (video.paused !== linkedVideo.paused) {
          if (linkedVideo.paused) {
            video.pause();
          } else {
            video.play().catch(() => console.error("Error playing video."));
          }
        }
        if (Math.abs(video.currentTime - linkedVideo.currentTime) > OUT_OF_SYNC_SEC) {
          video.currentTime = linkedVideo.currentTime;
        }
      }
    }
  });
  updatedVideoEnterQuery(world).forEach(eid => {
    if (!hasComponent(world, LinkedMedia, eid)) return;
    const linked = LinkedMedia.linkedRef[eid];
    const video = MediaVideoData.get(eid)!;
    const linkedVideo = MediaVideoData.get(linked)!;

    if (video.paused !== linkedVideo.paused) {
      if (!hasComponent(world, NetworkedVideo, eid)) {
        takeOwnership(world, linked);
      }
      if (video.paused) {
        linkedVideo.pause();
      } else {
        linkedVideo.play().catch(() => console.error("Error playing video."));
      }
    }
    if (Math.abs(video.currentTime - linkedVideo.currentTime) > OUT_OF_SYNC_SEC) {
      if (!hasComponent(world, NetworkedVideo, eid)) {
        takeOwnership(world, linked);
      }
      linkedVideo.currentTime = video.currentTime;
    }
  });
  mediaVideoExitQuery(world).forEach(eid => {
    if (hasComponent(world, LinkedMedia, eid)) {
      removeComponent(world, LinkedMedia, eid);
    }
  });
}
