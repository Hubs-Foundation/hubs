import { create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { addComponent } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";
import { ProjectionMode } from "../utils/projection-mode";
import { MediaVideo, MediaVideoData } from "../bit-components";
import { HubsWorld } from "../app";
import { EntityID } from "../utils/networking-types";
import { Texture } from "three";

export const VIDEO_FLAGS = {
  AUTOPLAY: 1 << 0,
  LOOP: 1 << 1,
  CONTROLS: 1 << 2,
  PROJECTION_FLAT: 1 << 3,
  PROJECTION_EQUIRECT: 1 << 4
};

export interface VideoParams {
  texture: Texture;
  ratio: number;
  projection: ProjectionMode;
  autoPlay: boolean;
  video: HTMLVideoElement;
  loop: boolean;
  controls: boolean;
}

export function inflateVideo(world: HubsWorld, eid: EntityID, params: VideoParams) {
  const { texture, ratio, projection, autoPlay, video, loop, controls } = params;
  const mesh =
    projection === ProjectionMode.SPHERE_EQUIRECTANGULAR
      ? create360ImageMesh(texture)
      : createImageMesh(texture, ratio);
  addObject3DComponent(world, eid, mesh);
  addComponent(world, MediaVideo, eid);

  autoPlay && (MediaVideo.flags[eid] |= VIDEO_FLAGS.AUTOPLAY);
  loop && (MediaVideo.flags[eid] |= VIDEO_FLAGS.LOOP);
  controls && (MediaVideo.flags[eid] |= VIDEO_FLAGS.CONTROLS);
  if (projection === ProjectionMode.SPHERE_EQUIRECTANGULAR) {
    MediaVideo.flags[eid] |= VIDEO_FLAGS.PROJECTION_EQUIRECT;
  } else {
    MediaVideo.flags[eid] |= VIDEO_FLAGS.PROJECTION_FLAT;
  }

  MediaVideo.ratio[eid] = ratio;
  MediaVideoData.set(eid, video);
  return eid;
}
