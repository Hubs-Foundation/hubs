import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { MediaLoader } from "../bit-components";
import { MEDIA_LOADER_FLAGS } from "../bit-systems/media-loading";
import { MediaParams } from "../prefabs/media";

export function inflateMediaLoader(world: HubsWorld, eid: number, { src, recenter, resize }: MediaParams) {
  addComponent(world, MediaLoader, eid);
  let flags = 0;
  if (recenter) flags |= MEDIA_LOADER_FLAGS.RECENTER;
  if (resize) flags |= MEDIA_LOADER_FLAGS.RESIZE;
  MediaLoader.flags[eid] = flags;
  MediaLoader.src[eid] = APP.getSid(src)!;
}
