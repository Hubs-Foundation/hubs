import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { AudioParams } from "../bit-components";
import { AudioSettings } from "../components/audio-params";

export function inflateAudioParams(world: HubsWorld, eid: number, params: AudioSettings) {
  addComponent(world, AudioParams, eid);
  APP.audioOverrides.set(eid, params);
}
