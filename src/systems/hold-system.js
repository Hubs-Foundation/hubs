import { paths } from "./userinput/paths";
import { addComponent, removeComponent, defineQuery, hasComponent } from "bitecs";
import {
  Held,
  Holdable,
  HoveredRemoteRight,
  HeldRemoteRight,
  HoveredRemoteLeft,
  HeldRemoteLeft,
  HoveredHandRight,
  HeldHandRight,
  HoveredHandLeft,
  HeldHandLeft,
  AEntity,
  Networked,
  Rigidbody
} from "../bit-components";
import { canMove } from "../utils/permissions-utils";
import { canMove as canMoveEntity } from "../utils/bit-permissions-utils";
import { isPinned } from "../bit-systems/networking";
import { takeOwnership } from "../utils/take-ownership";
import { findAncestorWithComponents } from "../utils/bit-utils";

const GRAB_REMOTE_RIGHT = paths.actions.cursor.right.grab;
const DROP_REMOTE_RIGHT = paths.actions.cursor.right.drop;
const GRAB_REMOTE_LEFT = paths.actions.cursor.left.grab;
const DROP_REMOTE_LEFT = paths.actions.cursor.left.drop;
const GRAB_HAND_RIGHT = paths.actions.rightHand.grab;
const DROP_HAND_RIGHT = paths.actions.rightHand.drop;
const GRAB_HAND_LEFT = paths.actions.leftHand.grab;
const DROP_HAND_LEFT = paths.actions.leftHand.drop;

function hasPermissionToGrab(world, eid) {
  if (hasComponent(world, AEntity, eid)) {
    return canMove(world.eid2obj.get(eid).el);
  } else {
    return canMoveEntity(eid);
  }
}

export function isAEntityPinned(world, eid) {
  if (hasComponent(world, AEntity, eid)) {
    const el = world.eid2obj.get(eid).el;
    return !!el.components?.pinnable?.data?.pinned;
  }
  return false;
}

// Special check for Droped/Pasted Media with new loader enabled.
//
// ** Problem **
// When you drop or paste a media file or url, a MediaLoader entity is created.
// This entity downloads the media file and creates a media (e.g., video)
// entity. The MediaLoader entity object then adds the media entity object
// as its child.
//
// The MediaLoader entity does not have a visible object after the loading
// cube disappears, but the media entity does. Both entities are hover targets,
// but after the loading cube disappears, the MediaLoader entity can no longer
// be hovered because it does not have a visible object. Only the media entity
// can be hovered at this point.
//
// The media entity is not a networked entity, but the MediaLoader entity is.
// This means that the MediaLoader entity can be pinned (the creator is "reticulum"),
// but the media entity cannot. If you check whether the media entity is pinned,
// it will always return false. Then media entity will always be grabbable even if
// it is pinned (more precisely its parent is pinned).
//
// **Solution**
// Check its parent is pinned to check media entity is pinned.
//
// TODO: This solution is hacky. Fix the root issue.
//
// Alternate solution: Simply recognize an entity as pinned if its any
// ancestor is pinned (in hold-system) unless there is a case that
// descendant entity under pinned entity wants to be grabbable.
//
// Update:  As now we are supporting grabbable scene objects, we look for the
//          root holdable entity with a rigid body as the only rigid body
//          in the hierarchy should be at the root of the grabbable object.
function grab(world, userinput, queryHovered, held, grabPath) {
  const hovered = queryHovered(world)[0];

  const interactable = findAncestorWithComponents(world, [Holdable, Rigidbody], hovered);
  const target = interactable ? interactable : hovered;
  const isEntityPinned = isPinned(target) || isAEntityPinned(world, target);

  if (
    target &&
    userinput.get(grabPath) &&
    (!isEntityPinned || AFRAME.scenes[0].is("frozen")) &&
    hasPermissionToGrab(world, target)
  ) {
    if (hasComponent(world, Networked, target)) {
      takeOwnership(world, target);
    }
    addComponent(world, held, target);
    addComponent(world, Held, target);
  }
}

function drop(world, userinput, queryHeld, held, dropPath) {
  const heldEid = queryHeld(world)[0];
  if (heldEid && userinput.get(dropPath)) {
    // TODO: Drop on ownership lost
    removeComponent(world, held, heldEid);

    if (
      !hasComponent(world, HeldRemoteRight, heldEid) &&
      !hasComponent(world, HeldRemoteLeft, heldEid) &&
      !hasComponent(world, HeldHandRight, heldEid) &&
      !hasComponent(world, HeldHandLeft, heldEid)
    ) {
      removeComponent(world, Held, heldEid);
    }
  }
}

const queryHeldRemoteRight = defineQuery([Holdable, HeldRemoteRight]);
const queryHoveredRemoteRight = defineQuery([Holdable, HoveredRemoteRight]);

const queryHeldRemoteLeft = defineQuery([Holdable, HeldRemoteLeft]);
const queryHoveredRemoteLeft = defineQuery([Holdable, HoveredRemoteLeft]);

const queryHeldHandRight = defineQuery([Holdable, HeldHandRight]);
const queryHoveredHandRight = defineQuery([Holdable, HoveredHandRight]);

const queryHeldHandLeft = defineQuery([Holdable, HeldHandLeft]);
const queryHoveredHandLeft = defineQuery([Holdable, HoveredHandLeft]);

export function holdSystem(world, userinput) {
  grab(world, userinput, queryHoveredRemoteRight, HeldRemoteRight, GRAB_REMOTE_RIGHT);
  grab(world, userinput, queryHoveredRemoteLeft, HeldRemoteLeft, GRAB_REMOTE_LEFT);
  grab(world, userinput, queryHoveredHandRight, HeldHandRight, GRAB_HAND_RIGHT);
  grab(world, userinput, queryHoveredHandLeft, HeldHandLeft, GRAB_HAND_LEFT);

  drop(world, userinput, queryHeldRemoteRight, HeldRemoteRight, DROP_REMOTE_RIGHT);
  drop(world, userinput, queryHeldRemoteLeft, HeldRemoteLeft, DROP_REMOTE_LEFT);
  drop(world, userinput, queryHeldHandRight, HeldHandRight, DROP_HAND_RIGHT);
  drop(world, userinput, queryHeldHandLeft, HeldHandLeft, DROP_HAND_LEFT);
}
