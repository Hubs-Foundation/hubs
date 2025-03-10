import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { AudioParams } from "../bit-components";
import { AudioSettings } from "../components/audio-params";

export function inflateAudioParams(world: HubsWorld, eid: number, params: AudioSettings) {
  addComponent(world, AudioParams, eid);

  // https://developer.mozilla.org/en-US/docs/Web/API/PannerNode/coneOuterGain#value
  if (params.coneOuterGain !== undefined) {
    params.coneOuterGain = params.coneOuterGain > 1 ? 1 : params.coneOuterGain;
    params.coneOuterGain = params.coneOuterGain < 0 ? 0 : params.coneOuterGain;
  }

  APP.audioOverrides.set(eid, params);
}
