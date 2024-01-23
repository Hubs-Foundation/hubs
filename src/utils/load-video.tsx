/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadVideoTexture } from "../utils/load-video-texture";
import { HubsWorld } from "../app";
import { HubsVideoTexture } from "../textures/HubsVideoTexture";
import { EntityID } from "./networking-types";
import { Networked, NetworkedVideo, ObjectMenuTarget } from "../bit-components";
import { ObjectMenuTargetFlags } from "../inflators/object-menu-target";
import { addComponent } from "bitecs";
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

export function* loadVideo(
  world: HubsWorld,
  eid: EntityID,
  url: string,
  contentType: string,
  params: Params,
  isNetworked: boolean
) {
  const { loop, autoPlay, controls, projection } = Object.assign({}, DEFAULTS, params);
  const { texture, ratio, video }: { texture: HubsVideoTexture; ratio: number; video: HTMLVideoElement } =
    yield loadVideoTexture(url, contentType, loop, autoPlay);

  ObjectMenuTarget.flags[eid] |= ObjectMenuTargetFlags.Flat;

  const videoEid = renderAsEntity(
    world,
    <entity
      name="Video"
      grabbable={{ cursor: true, hand: false }}
      objectMenuTarget={{ isFlat: true }}
      video={{
        texture,
        ratio,
        projection,
        video,
        controls
      }}
    ></entity>
  );

  if (isNetworked) {
    addComponent(world, Networked, videoEid);
    addComponent(world, NetworkedVideo, videoEid);
  }

  return videoEid;
}
