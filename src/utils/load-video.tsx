/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode, getProjectionFromProjectionName } from "./projection-mode";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadVideoTexture } from "../utils/load-video-texture";
import { HubsWorld } from "../app";
import { HubsVideoTexture } from "../textures/HubsVideoTexture";
import { EntityID } from "./networking-types";
import { MediaVideoLoaderData } from "../bit-components";
import { VideoLoaderParams } from "../inflators/video-loader";

export function* loadVideo(world: HubsWorld, eid: EntityID, url: string, contentType: string) {
  let loop = true;
  let autoPlay = true;
  let controls = true;
  let projection = ProjectionMode.FLAT;
  if (MediaVideoLoaderData.has(eid)) {
    const params = MediaVideoLoaderData.get(eid)! as VideoLoaderParams;
    loop = params.loop;
    autoPlay = params.autoPlay;
    controls = params.controls;
    projection = getProjectionFromProjectionName(params.projection);
    MediaVideoLoaderData.delete(eid);
  }

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
