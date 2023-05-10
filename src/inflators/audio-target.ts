import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { AudioTarget } from "../bit-components";
import { EntityID } from "../utils/networking-types";

export const AUDIO_TARGET_FLAGS = {
  DEBUG: 1 << 0
};

const DEFAULTS = {
  minDelay: 0.01,
  maxDelay: 0.13,
  debug: false
};

export type AudioTargetParams = {
  minDelay: number;
  maxDelay: number;
  srcNode: EntityID;
  debug: boolean;
};

export function inflateAudioTarget(world: HubsWorld, eid: number, params: AudioTargetParams) {
  params = Object.assign({}, DEFAULTS, params);

  addComponent(world, AudioTarget, eid);

  AudioTarget.maxDelay[eid] = params.maxDelay;
  AudioTarget.maxDelay[eid] = params.maxDelay;
  AudioTarget.source[eid] = params.srcNode;
  if (params.debug) AudioTarget.flags[eid] |= AUDIO_TARGET_FLAGS.DEBUG;
}
