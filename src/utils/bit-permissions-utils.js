import { hasComponent } from "bitecs";
import { HoldableButton } from "../bit-components";
import { isPinned } from "../bit-systems/networking";

export function canMove(eid) {
  // Add support to pen/emojis when those are migrated to bitECS
  return (
    hasComponent(APP.world, HoldableButton, eid) ||
    (APP.hubChannel.can("spawn_and_move_media") && (!isPinned(eid) || APP.hubChannel.can("pin_objects")))
  );
}
