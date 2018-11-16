import { paths } from "../paths";
export class KeyboardDevice {
  constructor() {
    this.keys = {};
    this.events = [];

    ["keydown", "keyup"].map(x => document.addEventListener(x, this.events.push.bind(this.events)));
    ["blur"].map(x => window.addEventListener(x, this.events.push.bind(this.events)));
  }

  write(frame) {
    this.events.forEach(event => {
      if (event.type === "blur") {
        this.keys = {};
        return;
      }
      this.keys[paths.device.keyboard.key(event.key)] = event.type === "keydown";
    });
    while (this.events.length) {
      this.events.pop();
    }
    Object.assign(frame, this.keys);
  }
}
