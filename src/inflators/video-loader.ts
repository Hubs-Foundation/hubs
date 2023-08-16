import { HubsWorld } from "../app";
import { MediaVideoLoaderData } from "../bit-components";
import { inflateMediaLoader } from "./media-loader";

export interface VideoLoaderParams {
  src: string;
  projection?: string;
  autoPlay: boolean;
  controls: boolean;
  loop: boolean;
}

export function inflateVideoLoader(world: HubsWorld, eid: number, params: VideoLoaderParams) {
  inflateMediaLoader(world, eid, {
    src: params.src,
    recenter: false,
    resize: false,
    animateLoad: false,
    isObjectMenuTarget: false
  });

  MediaVideoLoaderData.set(eid, params);
}
