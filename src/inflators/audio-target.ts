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

  // https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createDelay#maxdelaytime
  params.maxDelay = params.maxDelay < 180 ? params.maxDelay : 179;
  AudioTarget.maxDelay[eid] = params.maxDelay < 0 ? 0 : params.maxDelay;
  params.minDelay = params.minDelay > AudioTarget.maxDelay[eid] ? AudioTarget.maxDelay[eid] : params.minDelay;
  AudioTarget.minDelay[eid] = params.minDelay < 0 ? 0 : params.minDelay;
  AudioTarget.source[eid] = params.srcNode;
  if (params.debug) AudioTarget.flags[eid] |= AUDIO_TARGET_FLAGS.DEBUG;
}
