import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { AudioSource } from "../bit-components";

export const AUDIO_SOURCE_FLAGS = {
  ONLY_MODS: 1 << 0,
  MUTE_SELF: 1 << 1,
  DEBUG: 1 << 2
};

const DEFAULTS = {
  minDelay: 0.01,
  maxDelay: 0.13,
  debug: false
};

export type AudioSourceParams = {
  onlyMods: boolean;
  muteSelf: boolean;
  debug: boolean;
};

export function inflateAudioSource(world: HubsWorld, eid: number, params: AudioSourceParams) {
  params = Object.assign({}, DEFAULTS, params);

  addComponent(world, AudioSource, eid);

  let flags = 0;
  if (params.onlyMods) flags |= AUDIO_SOURCE_FLAGS.ONLY_MODS;
  if (params.muteSelf) flags |= AUDIO_SOURCE_FLAGS.MUTE_SELF;
  if (params.debug) flags |= AUDIO_SOURCE_FLAGS.DEBUG;
  AudioSource.flags[eid] = flags;
}
