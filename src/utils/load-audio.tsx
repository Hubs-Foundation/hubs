/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { ProjectionMode } from "./projection-mode";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadAudioTexture } from "../utils/load-audio-texture";
import { HubsWorld } from "../app";
import { HubsVideoTexture } from "../textures/HubsVideoTexture";
import { ObjectMenuTarget } from "../bit-components";
import { ObjectMenuTargetFlags } from "../inflators/object-menu-target";
import { EntityID } from "./networking-types";

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

export function* loadAudio(world: HubsWorld, eid: EntityID, url: string, params: Params) {
  const { loop, autoPlay, controls, projection } = Object.assign({}, DEFAULTS, params);
  const { texture, ratio, video }: { texture: HubsVideoTexture; ratio: number; video: HTMLVideoElement } =
    yield loadAudioTexture(url, loop, autoPlay);

  ObjectMenuTarget.flags[eid] |= ObjectMenuTargetFlags.Flat;

  return renderAsEntity(
    world,
    <entity
      name="Audio"
      networked
      networkedVideo
      grabbable={{ cursor: true, hand: false }}
      // Audio and Video are handled very similarly in 3D scene
      // so create as video
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
}
