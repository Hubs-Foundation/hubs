import { hasComponent } from "bitecs";
import { HoldableButton } from "../bit-components";
import { isPinned } from "../bit-systems/networking";

export function canMove(eid) {
  return (
    hasComponent(APP.world, HoldableButton, eid) ||
    (APP.hubChannel.can("spawn_and_move_media") && (!isPinned(eid) || APP.hubChannel.can("pin_objects")))
  );
}
