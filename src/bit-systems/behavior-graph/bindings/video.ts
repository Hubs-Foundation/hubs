import { HubsWorld } from "../../../app";
import { EntityID, MediaVideo, MediaVideoData, NetworkedVideo } from "../../../bit-components";
import { VIDEO_FLAGS } from "../../../inflators/video";
import {
  ProjectionModeName,
  getProjectionFromProjectionName,
  getProjectionNameFromProjection
} from "../../../utils/projection-mode";

export interface GLTFVideoParams {
  src: string;
  projection: ProjectionModeName;
  autoPlay: boolean;
  controls: boolean;
  loop: boolean;
}

export function getVideo(world: HubsWorld, eid: EntityID): GLTFVideoParams {
  const video = MediaVideoData.get(eid)!;
  return {
    src: video.src,
    loop: video.loop,
    autoPlay: video.autoplay,
    projection: getProjectionNameFromProjection(MediaVideo.projection[eid]),
    controls: MediaVideo.flags[eid] & VIDEO_FLAGS.CONTROLS ? true : false
  };
}

export function setVideo(world: HubsWorld, eid: EntityID, params: GLTFVideoParams) {
  params = Object.assign({}, getVideo(world, eid), params);
  if (params.autoPlay) {
    NetworkedVideo.flags[eid] |= VIDEO_FLAGS.AUTO_PLAY;
  }
  if (params.loop) {
    NetworkedVideo.flags[eid] |= VIDEO_FLAGS.LOOP;
  }
  if (params.controls) {
    NetworkedVideo.flags[eid] |= VIDEO_FLAGS.CONTROLS;
  }
  NetworkedVideo.src[eid] = APP.getSid(params.src);
  NetworkedVideo.projection[eid] = getProjectionFromProjectionName(params.projection);
}
