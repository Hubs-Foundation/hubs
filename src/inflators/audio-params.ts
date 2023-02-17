import { HubsWorld } from "../app";
import { AudioSettings } from "../components/audio-params";

export function inflateAudioParams(world: HubsWorld, eid: number, params: AudioSettings) {
  APP.audioOverrides.set(eid, params);
}
