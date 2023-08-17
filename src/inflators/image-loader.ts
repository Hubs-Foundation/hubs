import { HubsWorld } from "../app";
import { ProjectionModeName } from "../utils/projection-mode";
import { inflateMediaLoader } from "./media-loader";
import { MediaImageLoaderData } from "../bit-components";
import { AlphaModeName } from "../utils/create-image-mesh";

export interface ImageLoaderParams {
  src: string;
  projection: ProjectionModeName;
  alphaMode: AlphaModeName;
  alphaCutoff: number;
}

const DEFAULTS: Partial<ImageLoaderParams> = {
  projection: ProjectionModeName.FLAT,
  alphaMode: AlphaModeName.OPAQUE,
  alphaCutoff: 0.5
};

export function inflateImageLoader(world: HubsWorld, eid: number, params: ImageLoaderParams) {
  inflateMediaLoader(world, eid, {
    src: params.src,
    recenter: false,
    resize: false,
    animateLoad: false,
    isObjectMenuTarget: false
  });

  const requiredParams = Object.assign({}, DEFAULTS, params) as Required<ImageLoaderParams>;
  MediaImageLoaderData.set(eid, requiredParams);
}
