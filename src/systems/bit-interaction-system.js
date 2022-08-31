import { handHoverSystem } from "./bit-hand-hover-system";
import { holdSystem } from "./hold-system";
import { dontHoldWithHandAndRemote, dontHoverAndHold } from "./not-hovered-if-held";

export function interactionSystem(world, cursorTargettingSystem, t, systems) {
  cursorTargettingSystem.tick(t); // handles hovers for cursors
  handHoverSystem(world, systems.interaction);
  holdSystem(world, systems.userinput);
  dontHoldWithHandAndRemote(world);
  dontHoverAndHold(world);
  // Copies hovered/held state (only for aframe entities) for querying by legacy systems/components
  systems.interaction.updateLegacyState();
}
