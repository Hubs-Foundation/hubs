import { HubsWorld } from "../app";
import { MediaVideoLoaderData } from "../bit-components";
import { ProjectionModeName } from "../utils/projection-mode";
import { inflateMediaLoader } from "./media-loader";

export interface VideoLoaderParams {
  src: string;
  projection: ProjectionModeName;
  autoPlay: boolean;
  controls: boolean;
  loop: boolean;
}

const DEFAULTS: Partial<VideoLoaderParams> = {
  projection: ProjectionModeName.FLAT,
  controls: true,
  autoPlay: true,
  loop: true
};

export function inflateVideoLoader(world: HubsWorld, eid: number, params: VideoLoaderParams) {
  inflateMediaLoader(world, eid, {
    src: params.src,
    recenter: false,
    resize: false,
    animateLoad: false,
    isObjectMenuTarget: false
  });

  const requiredParams = Object.assign({}, DEFAULTS, params) as Required<VideoLoaderParams>;
  MediaVideoLoaderData.set(eid, requiredParams);
}
