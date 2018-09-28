import { paths } from "../paths";

export class Hud {
  constructor() {
    this.events = [];
    document.querySelector("a-scene").addEventListener("penButtonPressed", this.events.push.bind(this.events));
  }

  write(frame) {
    frame[paths.device.hud.penButton] = this.events.length !== 0;
    while (this.events.length) {
      this.events.pop();
    }
  }
}
