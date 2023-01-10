import { defineQuery, removeComponent } from "bitecs";
import {
  HeldHandLeft,
  HeldHandRight,
  HeldRemoteLeft,
  HeldRemoteRight,
  HoveredRemoteRight,
  HoveredRemoteLeft,
  HoveredHandRight,
  HoveredHandLeft
} from "../bit-components";

function removeHover(world, entities, component) {
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    removeComponent(world, component, eid);
  }
}

const queryRemoteRight = defineQuery([HoveredRemoteRight, HeldRemoteRight]);
const queryRemoteLeft = defineQuery([HoveredRemoteLeft, HeldRemoteLeft]);
const queryHandRight = defineQuery([HoveredHandRight, HeldHandRight]);
const queryHandLeft = defineQuery([HoveredHandLeft, HeldHandLeft]);
export function dontHoverAndHold(world) {
  removeHover(world, queryRemoteRight(world), HoveredRemoteRight);
  removeHover(world, queryRemoteLeft(world), HoveredRemoteLeft);
  removeHover(world, queryHandRight(world), HoveredHandRight);
  removeHover(world, queryHandLeft(world), HoveredHandLeft);
}

const queryDoubleHeldRight = defineQuery([HeldHandRight, HeldRemoteRight]);
const queryDoubleHeldLeft = defineQuery([HeldHandLeft, HeldRemoteLeft]);
const queryDoubleHoverRight = defineQuery([HoveredHandRight, HoveredRemoteRight]);
const queryDoubleHoverLeft = defineQuery([HoveredHandLeft, HoveredRemoteLeft]);
export function dontHoldWithHandAndRemote(world) {
  queryDoubleHeldLeft(world).forEach(eid => removeComponent(world, HeldRemoteLeft, eid));
  queryDoubleHeldRight(world).forEach(eid => removeComponent(world, HeldRemoteRight, eid));
  // TODO this may not be needed because of CursorTogglingSystem
  queryDoubleHoverLeft(world).forEach(eid => removeComponent(world, HoveredRemoteLeft, eid));
  queryDoubleHoverRight(world).forEach(eid => removeComponent(world, HoveredRemoteRight, eid));
}
