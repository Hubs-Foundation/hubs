import { CursorTargettingSystem } from "./cursor-targetting-system";
import { ConstraintsSystem } from "./constraints-system";
import { TwoPointStretchingSystem } from "./two-point-stretching-system";

AFRAME.registerSystem("hubs-systems", {
  init() {
    this.cursorTargettingSystem = new CursorTargettingSystem();
    this.constraintsSystem = new ConstraintsSystem();
    this.twoPointStretchingSystem = new TwoPointStretchingSystem();
  },
  tick(t, dt) {
    const systems = AFRAME.scenes[0].systems;
    systems.userinput.tick2();
    this.cursorTargettingSystem.tick();
    systems.interaction.tick2();
    this.constraintsSystem.tick();
    this.twoPointStretchingSystem.tick();
  }
});
