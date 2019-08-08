import { paths } from "./userinput/paths";
import { waitForDOMContentLoaded } from "../utils/async-utils";

export class CursorTogglingSystem {
  constructor() {
    this.rightToggledOff = false;
    this.leftToggledOff = false;

    waitForDOMContentLoaded().then(() => {
      this.rightRemote = document.getElementById("cursor-controller");
      this.leftRemote = document.getElementById("cursor-controller2");
    });
  }
  tick(t) {
    const userinput = AFRAME.scenes[0].systems.userinput;
    const interaction = AFRAME.scenes[0].systems.interaction;

    if (userinput.get(paths.actions.cursor.right.wake)) {
      this.rightToggledOff = false;
      if (!interaction.state.leftRemote.held) {
        this.leftToggledOff = true;
      }
    }

    if (userinput.get(paths.actions.cursor.left.wake)) {
      this.leftToggledOff = false;
      if (!interaction.state.rightRemote.held) {
        this.rightToggledOff = true;
      }
    }

    this.rightRemote.components["cursor-controller"].toggledOff = this.rightToggledOff;
    this.leftRemote.components["cursor-controller"].toggledOff = this.leftToggledOff;
  }
}
