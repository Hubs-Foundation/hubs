import { paths } from "../paths";

export class HudDevice {
  constructor() {
    this.events = [];
    document.querySelector("a-scene").addEventListener("penButtonPressed", this.events.push.bind(this.events));
  }

  write(frame) {
    frame.setValueType(paths.device.hud.penButton, this.events.length !== 0);
    while (this.events.length) {
      this.events.pop();
    }
  }
}
