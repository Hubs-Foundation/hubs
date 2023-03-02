import { HubsWorld } from "../app";
import { ProjectionMode } from "../utils/projection-mode";
import { inflateMediaLoader } from "./media-loader";

export interface ImageLoaderParams {
  src: string;
  projection: ProjectionMode;
}

export function inflateImageLoader(world: HubsWorld, eid: number, params: ImageLoaderParams) {
  inflateMediaLoader(world, eid, {
    src: params.src,
    recenter: false,
    resize: false,
    animateLoad: false,
    isObjectMenuTarget: false
  });

  // TODO: Use projection
}
