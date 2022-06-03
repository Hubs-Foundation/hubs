import { addComponent, defineQuery, hasComponent, removeComponent } from "bitecs";
import { HandCollisionTarget, HoveredHandLeft, HoveredHandRight, Rigidbody } from "../bit-components";
import { handHoverSystem } from "./bit-hand-hover-system";
import { holdSystem } from "./hold-system";
import { notHoveredIfHeld } from "./not-hovered-if-held";

export function interactionSystem(world, cursorTargettingSystem, t, systems) {
  cursorTargettingSystem.tick(t); // handles hovers for cursors
  handHoverSystem(world, systems.interaction);

  holdSystem(world, systems.userinput);
  notHoveredIfHeld(world);

  // Copies hovered/held state (only for aframe entities) for querying by legacy systems/components
  systems.interaction.updateLegacyState();
}
