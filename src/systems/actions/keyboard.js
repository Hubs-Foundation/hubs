import { paths } from "./paths";
let keys = {};
const events = [];
export const keyboard = {
  name: "keyboard",
  init() {
    ["keydown", "keyup"].map(x => document.addEventListener(x, events.push.bind(events)));
    document.addEventListener("blur", () => {
      keys = {};
    });
  },
  write(frame) {
    events.forEach(event => {
      keys[`${paths.device.keyboard}${event.key.toLowerCase()}`] = event.type === "keydown";
    });
    while (events.length) {
      events.pop();
    }
    Object.assign(frame, keys);
  }
};
