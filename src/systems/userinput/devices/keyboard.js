import { paths } from "../paths";
export class KeyboardDevice {
  constructor() {
    this.seenKeys = new Set();
    this.keyIterator = [];
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
      const key = event.key;
      if (event.type === "blur") {
        this.keys = {};
        this.seenKeys.clear();
        this.keyIterator.length = 0;
        return;
      }
      this.keys[key] = event.type === "keydown";
      if (!this.seenKeys.has(event.key)) {
        this.seenKeys.add(event.key);
        this.keyIterator.push(event.key);
      }
    });
    while (this.events.length) {
      this.events.pop();
    }

    for (let i = 0; i < this.keyIterator.length; i++) {
      const key = this.keyIterator[i];
      const path = paths.device.keyboard.key(key);
      frame.setValueType(path, this.keys[key]);
    }
  }
}
