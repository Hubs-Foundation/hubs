import { addComponent } from "bitecs";
import { MediaLoader } from "../bit-components";
import { MEDIA_LOADER_FLAGS } from "../bit-systems/media-loading";
import { resolveRef } from "../utils/jsx-entity";

export function inflateMediaLoader(world, eid, { src, loadingObjectRef, recenter, resize }) {
  addComponent(world, MediaLoader, eid);
  let flags = 0;
  if (recenter) flags |= MEDIA_LOADER_FLAGS.RECENTER;
  if (resize) flags |= MEDIA_LOADER_FLAGS.RESIZE;
  MediaLoader.flags[eid] = flags;
  MediaLoader.src[eid] = APP.getSid(src);
  MediaLoader.loadingObjectRef[eid] = resolveRef(world, loadingObjectRef);
}
