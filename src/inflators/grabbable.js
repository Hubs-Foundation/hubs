import { addComponent } from "bitecs";
import {
  CursorRaycastable,
  HandCollisionTarget,
  Holdable,
  OffersHandConstraint,
  OffersRemoteConstraint,
  RemoteHoverTarget
} from "../bit-components";

export function inflateGrabbable(world, eid) {
  addComponent(world, CursorRaycastable, eid);
  addComponent(world, RemoteHoverTarget, eid);
  addComponent(world, HandCollisionTarget, eid);
  addComponent(world, OffersRemoteConstraint, eid);
  addComponent(world, OffersHandConstraint, eid);
  addComponent(world, Holdable, eid);
}
