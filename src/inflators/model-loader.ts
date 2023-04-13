import { HubsWorld } from "../app";
import { inflateMediaLoader } from "./media-loader";

export type ModelLoaderParams = {
  src: string;
};

export function inflateModelLoader(world: HubsWorld, eid: number, params: ModelLoaderParams) {
  inflateMediaLoader(world, eid, {
    src: params.src,
    recenter: true,
    resize: false,
    animateLoad: false,
    isObjectMenuTarget: false
  });
}
