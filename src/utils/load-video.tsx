/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadVideoTexture } from "../utils/load-video-texture";
import { HubsWorld } from "../app";
import { HubsVideoTexture } from "../textures/HubsVideoTexture";

export function* loadVideo(world: HubsWorld, url: string, contentType: string) {
  const { texture, ratio, video }: { texture: HubsVideoTexture; ratio: number; video: HTMLVideoElement } =
    yield loadVideoTexture(url, contentType);

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
        projection: ProjectionMode.FLAT,
        video
      }}
    ></entity>
  );
}
