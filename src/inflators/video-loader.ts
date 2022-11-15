import { HubsWorld } from "../app";
import { ProjectionMode } from "../utils/projection-mode";
import { inflateMediaLoader } from "./media-loader";

export interface VideoLoaderParams {
  src: string;
  projection: ProjectionMode;
  autoPlay: boolean;
  controls: boolean;
  loop: boolean;
}

export function inflateVideoLoader(world: HubsWorld, eid: number, params: VideoLoaderParams) {
  inflateMediaLoader(world, eid, { src: params.src, recenter: false, resize: false, animateLoad: false });

  // TODO: Use the rest of VideoLoaderParams
}
