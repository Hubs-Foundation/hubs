/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { VideoTexture } from "three";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadAudioTexture } from "../utils/load-audio-texture";
import { HubsWorld } from "../app";

export function* loadAudio(world: HubsWorld, url: string) {
  const { texture, ratio }: { texture: VideoTexture; ratio: number } = yield loadAudioTexture(url);

  // TODO: VideoTexture.image must be content that be played
  //       in video-system. And it is also used to render.
  //       It is audio here so the object will be rendered as
  //       black. Audio icon must be rendered. Fix this.

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
        projection: ProjectionMode.FLAT
      }}
    ></entity>
  );
}
