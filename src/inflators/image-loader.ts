import { HubsWorld } from "../app";
import { ProjectionMode } from "../utils/projection-mode";
import { inflateMediaLoader } from "./media-loader";
import { MediaImageLoaderData } from "../bit-components";

export interface ImageLoaderParams {
  src: string;
  projection: ProjectionMode;
  alphaMode: string;
  alphaCutoff: number;
}

export function inflateImageLoader(world: HubsWorld, eid: number, params: ImageLoaderParams) {
  inflateMediaLoader(world, eid, {
    src: params.src,
    recenter: false,
    resize: false,
    animateLoad: false,
    isObjectMenuTarget: false
  });

  MediaImageLoaderData.set(eid, params);
}
