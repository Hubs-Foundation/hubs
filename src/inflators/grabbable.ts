import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import {
  Carryable,
  CursorRaycastable,
  HandCollisionTarget,
  Holdable,
  OffersHandConstraint,
  OffersRemoteConstraint,
  RemoteHoverTarget
} from "../bit-components";

export type GrabbableParams = { cursor?: boolean; hand?: boolean; carryable?: boolean };
const defaults: GrabbableParams = { cursor: true, hand: true, carryable: false };
export function inflateGrabbable(world: HubsWorld, eid: number, props: GrabbableParams) {
  props = Object.assign({}, defaults, props);
  if (props.hand) {
    addComponent(world, HandCollisionTarget, eid);
    addComponent(world, OffersHandConstraint, eid);
  }
  if (props.cursor) {
    addComponent(world, CursorRaycastable, eid);
    addComponent(world, RemoteHoverTarget, eid);
    addComponent(world, OffersRemoteConstraint, eid);
  }
  // TODO should this just be its own thing?
  if (props.carryable) {
    addComponent(world, Carryable, eid);
  }
  addComponent(world, Holdable, eid);
}
