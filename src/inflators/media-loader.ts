import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { MediaLoader, MediaLoading, Networked } from "../bit-components";
import { MEDIA_LOADER_FLAGS } from "../bit-systems/media-loading";

export type MediaLoaderParams = {
  src: string;
  resize?: boolean;
  recenter?: boolean;
  animateLoad: boolean;
  fileId?: string;
  isObjectMenuTarget: boolean;
  moveParentNotObject?: boolean;
};

export function inflateMediaLoader(
  world: HubsWorld,
  eid: number,
  { src, recenter, resize, animateLoad, fileId, isObjectMenuTarget, moveParentNotObject }: MediaLoaderParams
) {
  addComponent(world, MediaLoader, eid);
  addComponent(world, MediaLoading, eid);
  let flags = 0;
  if (recenter) flags |= MEDIA_LOADER_FLAGS.RECENTER;
  if (resize) flags |= MEDIA_LOADER_FLAGS.RESIZE;
  if (animateLoad) flags |= MEDIA_LOADER_FLAGS.ANIMATE_LOAD;
  if (isObjectMenuTarget) flags |= MEDIA_LOADER_FLAGS.IS_OBJECT_MENU_TARGET;
  if (moveParentNotObject) flags |= MEDIA_LOADER_FLAGS.MOVE_PARENT_NOT_OBJECT;
  MediaLoader.flags[eid] = flags;
  if (fileId) {
    MediaLoader.fileId[eid] = APP.getSid(fileId)!;
  }
  MediaLoader.src[eid] = APP.getSid(src)!;
  MediaLoader.count[eid] = 0;
}
