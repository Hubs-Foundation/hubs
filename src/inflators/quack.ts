import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Quack } from "../bit-components";

export type QuackParams = {
  quackPercentage?: number;
  specialQuackPercentage?: number;
};

const DEFAULTS: Required<QuackParams> = {
  quackPercentage: 1.0,
  specialQuackPercentage: 0.01
};

export function inflateQuack(world: HubsWorld, eid: number, params: QuackParams) {
  params = Object.assign({}, params, DEFAULTS) as Required<QuackParams>;
  addComponent(world, Quack, eid);
  Quack.quackPercentage[eid] = params.quackPercentage as number;
  Quack.specialQuackPercentage[eid] = params.specialQuackPercentage as number;
}
