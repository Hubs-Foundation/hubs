import { HubsWorld } from "../app";
import { inflateMediaLoader } from "./media-loader";

export type LinkLoaderParams = {
  href: string;
};

export function inflateLinkLoader(world: HubsWorld, eid: number, params: LinkLoaderParams): number {
  inflateMediaLoader(world, eid, {
    src: params.href,
    resize: false,
    recenter: true,
    animateLoad: false,
    isObjectMenuTarget: true
  });

  return eid;
}
