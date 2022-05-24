import { holdSystem } from "./hold-system";
import { notHoveredIfHeld } from "./not-hovered-if-held";

export function interactionSystem(world, cursorTargettingSystem, t, systems) {
  cursorTargettingSystem.tick(t);
  // TODO: Hover with hands
  holdSystem(world, systems.userinput);
  notHoveredIfHeld(world);
  systems.interaction.tick2();
}
