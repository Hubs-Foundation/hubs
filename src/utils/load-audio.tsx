/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadAudioTexture } from "../utils/load-audio-texture";
import { HubsWorld } from "../app";
import { HubsVideoTexture } from "../textures/HubsVideoTexture";
import { EntityID } from "./networking-types";
import { MediaVideoLoaderData } from "../bit-components";
import { VideoLoaderParams } from "../inflators/video-loader";

export function* loadAudio(world: HubsWorld, eid: EntityID, url: string) {
  let loop = true;
  let autoPlay = true;
  let controls = true;
  let projection = ProjectionMode.FLAT;
  if (MediaVideoLoaderData.has(eid)) {
    const params = MediaVideoLoaderData.get(eid)! as VideoLoaderParams;
    loop = params.loop;
    autoPlay = params.autoPlay;
    controls = params.controls;
    MediaVideoLoaderData.delete(eid);
  }

  const { texture, ratio, video }: { texture: HubsVideoTexture; ratio: number; video: HTMLVideoElement } =
    yield loadAudioTexture(url, loop, autoPlay);

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
        projection,
        video,
        controls
      }}
    ></entity>
  );
}
