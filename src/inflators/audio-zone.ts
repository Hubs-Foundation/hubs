import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { AudioZone } from "../bit-components";

export const AUDIO_ZONE_FLAGS = {
  ENABLED: 1 << 0,
  IN_OUT: 1 << 1,
  OUT_IN: 1 << 2,
  DEBUG: 1 << 3,
  DYNAMIC: 1 << 4
};

export type AudioZoneParams = {
  enabled: boolean;
  inOut: boolean;
  outIn: boolean;
  debuggable: boolean;
  dynamic: boolean;
};

const DEFAULTS = {
  enabled: true,
  inOut: true,
  outIn: true,
  debuggable: true,
  dynamic: false // This will make the zone to update it's world matrix every frame. Only use for movable zones
};

export function inflateAudioZone(world: HubsWorld, eid: number, params: AudioZoneParams) {
  params = Object.assign({}, DEFAULTS, params);

  addComponent(world, AudioZone, eid);

  params.enabled && (AudioZone.flags[eid] |= AUDIO_ZONE_FLAGS.ENABLED);
  params.inOut && (AudioZone.flags[eid] |= AUDIO_ZONE_FLAGS.IN_OUT);
  params.outIn && (AudioZone.flags[eid] |= AUDIO_ZONE_FLAGS.OUT_IN);
  params.debuggable && (AudioZone.flags[eid] |= AUDIO_ZONE_FLAGS.DEBUG);
  params.dynamic && (AudioZone.flags[eid] |= AUDIO_ZONE_FLAGS.DYNAMIC);
}
