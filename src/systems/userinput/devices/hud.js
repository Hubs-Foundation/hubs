import { paths } from "../paths";

export class HudDevice {
  constructor() {
    this.events = [];
    document.querySelector("a-scene").addEventListener("penButtonPressed", this.events.push.bind(this.events));
    document.querySelector("a-scene").addEventListener("cameraButtonPressed", this.events.push.bind(this.events));
  }

  write(frame) {
    let pen = false;
    let camera = false;
    while (this.events.length) {
      const e = this.events.pop();
      if (e.type === "penButtonPressed") {
        pen = true;
      }
      if (e.type === "cameraButtonPressed") {
        camera = true;
      }
    }
    frame[paths.device.hud.cameraButton] = camera;
    frame[paths.device.hud.penButton] = pen;
  }
}
