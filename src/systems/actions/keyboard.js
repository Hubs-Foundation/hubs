import { paths } from "./paths";
export default class KeyboardDevice {
  constructor() {
    this.keys = {};
    this.events = [];

    ["keydown", "keyup"].map(x => document.addEventListener(x, this.events.push.bind(this.events)));

    document.addEventListener("blur", () => {
      this.keys = {};
    });
  }

  write(frame) {
    this.events.forEach(event => {
      this.keys[`${paths.device.keyboard}${event.key.toLowerCase()}`] = event.type === "keydown";
    });
    while (this.events.length) {
      this.events.pop();
    }
    Object.assign(frame, this.keys);
  }
}
