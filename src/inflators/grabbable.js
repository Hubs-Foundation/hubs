import { addComponent } from "bitecs";
import {
  CursorRaycastable,
  HandCollisionTarget,
  Holdable,
  OffersHandConstraint,
  OffersRemoteConstraint,
  RemoteHoverTarget
} from "../bit-components";

const defaults = { cursor: true, hand: true };
export function inflateGrabbable(world, eid, props) {
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
