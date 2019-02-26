import { paths } from "../paths";
export class KeyboardDevice {
  constructor() {
    this.keys = {};
    this.events = [];

    ["keydown", "keyup"].map(x =>
      document.addEventListener(x, e => {
        if (!e.key) return;
        this.events.push(e);

        // Block browser hotkeys for chat command, media browser and freeze
        if (
          (e.type === "keydown" &&
            e.key === "/" &&
            !["TEXTAREA", "INPUT"].includes(document.activeElement && document.activeElement.nodeName)) ||
          (e.ctrlKey &&
            (e.key === "1" ||
              e.key === "2" ||
              e.key === "3" ||
              e.key === "4" ||
              e.key === "5" ||
              e.key === "6" ||
              e.key === "7" ||
              e.key === "8" ||
              e.key === "9" ||
              e.key === "0")) ||
          e.key === "Tab"
        ) {
          e.preventDefault();
          return false;
        }
      })
    );
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
