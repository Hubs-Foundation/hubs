/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadAudioTexture } from "../utils/load-audio-texture";
import { HubsWorld } from "../app";
import { HubsVideoTexture } from "../textures/HubsVideoTexture";

export function* loadAudio(world: HubsWorld, url: string) {
  const { texture, ratio, video }: { texture: HubsVideoTexture; ratio: number; video: HTMLVideoElement } =
    yield loadAudioTexture(url);

  return renderAsEntity(
    world,
    <entity
      name="Audio"
      networked
      networkedVideo
      grabbable={{ cursor: true, hand: false }}
      // Audio and Video are handled very similarly in 3D scene
      // so create as video
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
