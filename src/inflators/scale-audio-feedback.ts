import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { ScaleAudioFeedback } from "../bit-components";

export interface ScaleAudioFeedbackParams {
  minScale: number;
  maxScale: number;
}

const DEFAULTS = {
  minScale: 1,
  maxScale: 1.5
};

export function inflateScaleAudioFeedback(world: HubsWorld, eid: number, params: ScaleAudioFeedbackParams) {
  params = Object.assign({}, DEFAULTS, params);

  addComponent(world, ScaleAudioFeedback, eid);
  ScaleAudioFeedback.minScale[eid] = params.minScale;
  ScaleAudioFeedback.maxScale[eid] = params.maxScale;
}
