import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { VideoTextureTarget } from "../bit-components";
import { EntityID } from "../utils/networking-types";

export const VIDEO_TEXTURE_TARGET_FLAGS = {
  TARGET_BASE_MAP: 1 << 0,
  TARGET_EMISSIVE_MAP: 1 << 1
};

export interface VideoTextureTargetParams {
  srcNode: EntityID;
  targetBaseColorMap: boolean;
  targetEmissiveMap: boolean;
}

export function inflateVideoTextureTarget(world: HubsWorld, eid: number, props: VideoTextureTargetParams) {
  addComponent(world, VideoTextureTarget, eid);
  VideoTextureTarget.source[eid] = props.srcNode;
  let flags = 0;
  if (props.targetBaseColorMap) flags |= VIDEO_TEXTURE_TARGET_FLAGS.TARGET_BASE_MAP;
  if (props.targetEmissiveMap) flags |= VIDEO_TEXTURE_TARGET_FLAGS.TARGET_EMISSIVE_MAP;
  VideoTextureTarget.flags[eid] = flags;
}
