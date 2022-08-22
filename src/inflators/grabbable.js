import { addComponent } from "bitecs";
import {
  CursorRaycastable,
  HandCollisionTarget,
  Holdable,
  OffersHandConstraint,
  OffersRemoteConstraint,
  RemoteHoverTarget
} from "../bit-components";

export function inflateGrabbable(world, eid, props = { cursor: true, hand: true }) {
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
