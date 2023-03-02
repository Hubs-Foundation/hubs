import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { MediaLoader } from "../bit-components";
import { MEDIA_LOADER_FLAGS } from "../bit-systems/media-loading";

export type MediaLoaderParams = {
  src: string;
  resize: boolean;
  recenter: boolean;
  animateLoad: boolean;
  isObjectMenuTarget: boolean;
};

export function inflateMediaLoader(
  world: HubsWorld,
  eid: number,
  { src, recenter, resize, animateLoad, isObjectMenuTarget }: MediaLoaderParams
) {
  addComponent(world, MediaLoader, eid);
  let flags = 0;
  if (recenter) flags |= MEDIA_LOADER_FLAGS.RECENTER;
  if (resize) flags |= MEDIA_LOADER_FLAGS.RESIZE;
  if (animateLoad) flags |= MEDIA_LOADER_FLAGS.ANIMATE_LOAD;
  if (isObjectMenuTarget) flags |= MEDIA_LOADER_FLAGS.IS_OBJECT_MENU_TARGET;
  MediaLoader.flags[eid] = flags;
  MediaLoader.src[eid] = APP.getSid(src)!;
}
