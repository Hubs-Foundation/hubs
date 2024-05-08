import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import {
  CursorRaycastable,
  HandCollisionTarget,
  OffersHandConstraint,
  OffersRemoteConstraint,
  RemoteHoverTarget
} from "../bit-components";
import { inflateHoldable } from "./holdable";

export type GrabbableParams = { cursor: boolean; hand: boolean };
const defaults: GrabbableParams = { cursor: true, hand: true };
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
  inflateHoldable(world, eid);
}
