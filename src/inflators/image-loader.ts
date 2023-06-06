import { HubsWorld } from "../app";
import { ProjectionMode } from "../utils/projection-mode";
import { inflateMediaLoader } from "./media-loader";
import { MediaImage } from "../bit-components";
import { AlphaMode } from "../utils/create-image-mesh";

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

  const { projection, alphaMode, alphaCutoff } = params;
  MediaImage.projection[eid] = APP.getSid(projection ? projection : ProjectionMode.FLAT);
  MediaImage.alphaMode[eid] = APP.getSid(alphaMode ? alphaMode : AlphaMode.Opaque);
  alphaCutoff && (MediaImage.alphaCutoff[eid] = alphaCutoff);
}
