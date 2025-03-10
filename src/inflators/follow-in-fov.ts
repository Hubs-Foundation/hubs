import { addComponent } from "bitecs";
import { FollowInFov } from "../bit-components";
import { HubsWorld } from "../app";

export type FollowInFovParams = {
  angle?: number;
  speed?: number;
  offset: [number, number, number];
};

const DEFAULTS = {
  angle: 45.0,
  speed: 0.003
};

export function inflateFollowInFov(world: HubsWorld, eid: number, params: FollowInFovParams) {
  const requiredParams = Object.assign({}, DEFAULTS, params) as Required<FollowInFovParams>;

  addComponent(world, FollowInFov, eid);
  FollowInFov.angle[eid] = requiredParams.angle;
  FollowInFov.speed[eid] = requiredParams.speed;
  FollowInFov.started[eid] = 0;
  FollowInFov.offset[eid].set(requiredParams.offset);

  return eid;
}
