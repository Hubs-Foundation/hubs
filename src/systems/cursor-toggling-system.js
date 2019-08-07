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

    if (userinput.get(paths.actions.cursor.wake)) {
      if (!interaction.state.leftRemote.held) {
        this.leftToggledOff = true;
      }
      this.rightToggledOff = false;
    }

    if (userinput.get(paths.actions.cursor.left.wake)) {
      if (!interaction.state.rightRemote.held) {
        this.rightToggledOff = true;
      }
      this.leftToggledOff = false;
    }

    this.rightRemote.components["cursor-controller"].toggledOff = this.rightToggledOff;
    this.leftRemote.components["cursor-controller"].toggledOff = this.leftToggledOff;
  }
}
