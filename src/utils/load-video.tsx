/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { VideoTexture } from "three";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadVideoTexture } from "../utils/load-video-texture";
import { HubsWorld } from "../app";
import { MEDIA_LOADER_FLAGS } from "../bit-systems/media-loading";

export function* loadVideo(world: HubsWorld, flags: number, url: string) {
  const { texture, ratio }: { texture: VideoTexture; ratio: number } = yield loadVideoTexture(url);
  const projection =
    flags & MEDIA_LOADER_FLAGS.SPHERICAL_PROJECTION ? ProjectionMode.SPHERE_EQUIRECTANGULAR : ProjectionMode.FLAT;

  return renderAsEntity(
    world,
    <entity
      name="Video"
      networked
      networkedVideo
      grabbable={{ cursor: true, hand: false }}
      video={{
        texture,
        ratio,
        autoPlay: true,
        projection
      }}
    ></entity>
  );
}
