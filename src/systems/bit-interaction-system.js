import { carrySystem } from "../bit-systems/carry-system";
import { handHoverSystem } from "./bit-hand-hover-system";
import { holdSystem } from "./hold-system";
import { dontHoldWithHandAndRemote, dontHoverAndHold } from "./not-hovered-if-held";

export function interactionSystem(
  world,
  cursorTargettingSystem,
  characterControllerSystem,
  cameraSystem,
  t,
  aframeSystems
) {
  cursorTargettingSystem.tick(t); // handles hovers for cursors
  handHoverSystem(world, aframeSystems.interaction);
  holdSystem(world, aframeSystems.userinput);
  carrySystem(world, aframeSystems.userinput, characterControllerSystem, cameraSystem.viewingCamera);
  dontHoldWithHandAndRemote(world);
  dontHoverAndHold(world);
  // Copies hovered/held state (only for aframe entities) for querying by legacy systems/components
  aframeSystems.interaction.updateLegacyState();
}
