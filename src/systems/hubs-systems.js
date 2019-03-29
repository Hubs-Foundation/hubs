import { CursorTargettingSystem } from "./cursor-targetting-system";
import { ConstraintsSystem } from "./constraints-system";
import { TwoPointStretchingSystem } from "./two-point-stretching-system";
import { SingleActionButtonSystem, HoldableButtonSystem, HoverButtonSystem } from "./button-systems";
import { HoverMenuSystem } from "./hover-menu-system";
import { PinnableDroppedSystem } from "./pinnable-dropped-system";

AFRAME.registerSystem("hubs-systems", {
  init() {
    this.cursorTargettingSystem = new CursorTargettingSystem();
    this.constraintsSystem = new ConstraintsSystem();
    this.twoPointStretchingSystem = new TwoPointStretchingSystem();
    this.singleActionButtonSystem = new SingleActionButtonSystem();
    this.holdableButtonSystem = new HoldableButtonSystem();
    this.hoverButtonSystem = new HoverButtonSystem();
    this.hoverMenuSystem = new HoverMenuSystem();
    this.pinnableDroppedSystem = new PinnableDroppedSystem();
  },

  tick() {
    const systems = AFRAME.scenes[0].systems;
    systems.userinput.tick2();
    this.cursorTargettingSystem.tick();
    systems.interaction.tick2();
    this.constraintsSystem.tick();
    this.twoPointStretchingSystem.tick();
    this.singleActionButtonSystem.tick();
    this.holdableButtonSystem.tick();
    this.hoverButtonSystem.tick();
    this.hoverMenuSystem.tick();
    this.pinnableDroppedSystem.tick();
  }
});
