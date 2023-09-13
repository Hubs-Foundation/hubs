/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadVideoTexture } from "../utils/load-video-texture";
import { HubsWorld } from "../app";
import { HubsVideoTexture } from "../textures/HubsVideoTexture";

type Params = {
  loop?: boolean;
  autoPlay?: boolean;
  controls?: boolean;
  projection?: ProjectionMode;
};

const DEFAULTS: Required<Params> = {
  loop: true,
  autoPlay: true,
  controls: true,
  projection: ProjectionMode.FLAT
};

export function* loadVideo(world: HubsWorld, url: string, contentType: string, params: Params) {
  const { loop, autoPlay, controls, projection } = Object.assign({}, DEFAULTS, params);
  const { texture, ratio, video }: { texture: HubsVideoTexture; ratio: number; video: HTMLVideoElement } =
    yield loadVideoTexture(url, contentType, loop, autoPlay);

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
        projection,
        video,
        controls
      }}
    ></entity>
  );
}
