import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import {
  CursorRaycastable,
  HandCollisionTarget,
  Holdable,
  InteractableObject,
  Networked,
  NetworkedTransform,
  OffersHandConstraint,
  OffersRemoteConstraint,
  RemoteHoverTarget
} from "../bit-components";

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
  addComponent(world, Holdable, eid);
}

export function inflateGLTFGrabbable(world: HubsWorld, eid: number, props: GrabbableParams) {
  inflateGrabbable(world, eid, props);
  addComponent(world, InteractableObject, eid, true);
  addComponent(world, Networked, eid, true);
  addComponent(world, NetworkedTransform, eid, true);
}
