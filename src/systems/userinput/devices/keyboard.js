import { paths } from "../paths";
import { ArrayBackedSet } from "../array-backed-set";

// TODO currently hardcoding these keys to be physical location based instead of character based. We likely want to make this part of the bindings themselves.
const CODE_TO_KEY = {
  KeyW: "w",
  KeyA: "a",
  KeyS: "s",
  KeyD: "d",
  KeyQ: "q",
  KeyE: "e"
};

export class KeyboardDevice {
  constructor() {
    this.seenKeys = new ArrayBackedSet();
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
            !["TEXTAREA", "INPUT"].includes(document.activeElement && document.activeElement.nodeName) &&
            !(document.activeElement && document.activeElement.contentEditable === "true")) ||
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
          (e.key === "Tab" && document.activeElement.classList.contains("a-canvas"))
        ) {
          e.preventDefault();
          return false;
        }
      })
    );
    ["blur"].map(x => window.addEventListener(x, this.events.push.bind(this.events)));
  }

  write(frame) {
    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      if (event.type === "blur") {
        this.keys = {};
        this.seenKeys.clear();
      } else {
        let key = event.key.toLowerCase();
        // Use event.code and not event.key for wasdqe controls so this works
        // for non QWERTY keyboards.
        key = (event.code && CODE_TO_KEY[event.code]) || key;
        this.keys[key] = event.type === "keydown";
        this.seenKeys.add(key);
      }
    }

    this.events.length = 0;

    for (let i = 0; i < this.seenKeys.items.length; i++) {
      const key = this.seenKeys.items[i];
      const path = paths.device.keyboard.key(key);
      frame.setValueType(path, this.keys[key]);
    }
  }
}
