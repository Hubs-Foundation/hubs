import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { MorphAudioFeedback } from "../bit-components";

export interface MorphAudioFeedbackParams {
  name: string;
  minValue: number;
  maxValue: number;
}

const DEFAULTS = {
  minValue: 1,
  maxValue: 1.5
};

export function inflateMorphAudioFeedback(world: HubsWorld, eid: number, params: MorphAudioFeedbackParams) {
  params = Object.assign({}, DEFAULTS, params);

  addComponent(world, MorphAudioFeedback, eid);
  const sid = APP.getSid(params.name);
  MorphAudioFeedback.name[eid] = sid;
  MorphAudioFeedback.minValue[eid] = params.minValue;
  MorphAudioFeedback.maxValue[eid] = params.maxValue;
}
