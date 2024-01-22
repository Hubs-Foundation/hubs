import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import {
  MirroredMedia,
  LinkedMedia,
  MediaVideo,
  NetworkedVideo,
  MediaVideoData,
  MediaVideoUpdated,
  AudioEmitter
} from "../bit-components";
import { findAncestorWithComponent, findChildWithComponent } from "../utils/bit-utils";
import { takeOwnership } from "../utils/take-ownership";
import { OUT_OF_SYNC_SEC } from "./video-system";
import { linkMedia } from "./linked-media-system";
import { updateAudioSettings } from "../update-audio-settings";

const mediaVideoQuery = defineQuery([MediaVideo]);
const mediaVideoEnterQuery = enterQuery(mediaVideoQuery);
const updatedVideoQuery = defineQuery([MediaVideoUpdated]);
const updatedVideoEnterQuery = enterQuery(updatedVideoQuery);
const linkedMediaQuery = defineQuery([LinkedMedia]);
const linkedMediaExitQuery = exitQuery(linkedMediaQuery);
export function linkedVideoSystem(world: HubsWorld) {
  mediaVideoEnterQuery(world).forEach(eid => {
    const mirroredMediaEid = findAncestorWithComponent(world, MirroredMedia, eid);
    if (mirroredMediaEid) {
      const mediaMirroredEid = MirroredMedia.linkedRef[mirroredMediaEid];
      const sourceMediaEid = findChildWithComponent(world, MediaVideo, mediaMirroredEid)!;
      if (sourceMediaEid) {
        linkMedia(world, eid, sourceMediaEid);
        addComponent(world, MediaVideoUpdated, sourceMediaEid);
        const sourceAudioEid = findChildWithComponent(world, AudioEmitter, sourceMediaEid);
        if (sourceAudioEid) {
          APP.linkedMutedState.add(sourceAudioEid);
          const audio = APP.audios.get(sourceAudioEid);
          if (audio) {
            updateAudioSettings(sourceAudioEid, audio);
          }
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
    if (Math.abs(video.currentTime - linkedVideo.currentTime)) {
      if (!hasComponent(world, NetworkedVideo, eid)) {
        takeOwnership(world, linked);
      }
      linkedVideo.currentTime = video.currentTime;
    }
  });
  linkedMediaExitQuery(world).forEach(eid => {
    if (hasComponent(world, MediaVideo, eid)) {
      const audioEid = findChildWithComponent(world, AudioEmitter, eid);
      if (audioEid) {
        APP.linkedMutedState.delete(audioEid);
        const audio = APP.audios.get(audioEid);
        if (audio) {
          updateAudioSettings(audioEid, audio);
        }
      }
    }
  });
}
