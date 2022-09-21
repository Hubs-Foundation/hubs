import { handHoverSystem } from "./bit-hand-hover-system";
import { holdSystem } from "./hold-system";
import { dontHoldWithHandAndRemote, dontHoverAndHold } from "./not-hovered-if-held";

export function interactionSystem(world, cursorTargettingSystem, t, aframeSystems) {
  cursorTargettingSystem.tick(t); // handles hovers for cursors
  handHoverSystem(world, aframeSystems.interaction);
  holdSystem(world, aframeSystems.userinput);
  dontHoldWithHandAndRemote(world);
  dontHoverAndHold(world);
  // Copies hovered/held state (only for aframe entities) for querying by legacy systems/components
  aframeSystems.interaction.updateLegacyState();
}
