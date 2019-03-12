import { paths } from "../paths";

// TODO: Where do these values (500, 10, 2) come from?
const modeMod = {
  [WheelEvent.DOM_DELTA_PIXEL]: 500,
  [WheelEvent.DOM_DELTA_LINE]: 10,
  [WheelEvent.DOM_DELTA_PAGE]: 2
};

const isInModal = (() => {
  let uiRoot = null;

  return function() {
    if (!uiRoot) {
      uiRoot = document.querySelector(".ui-root");
    }

    return uiRoot && uiRoot.classList.contains("in-modal-or-overlay");
  };
})();

export class MouseDevice {
  constructor() {
    this.events = [];
    this.coords = [0, 0]; // normalized screenspace coordinates in [(-1, 1), (-1, 1)]
    this.movementXY = [0, 0]; // deltas
    this.buttonLeft = false;
    this.buttonRight = false;
    this.wheel = 0; // delta

    const queueEvent = this.events.push.bind(this.events);
    const canvas = document.querySelector("canvas");
    ["mousedown", "wheel"].map(x => canvas.addEventListener(x, queueEvent));
    ["mousemove", "mouseup"].map(x => window.addEventListener(x, queueEvent));

    document.addEventListener("wheel", e => {
      // Do not capture wheel events if they are being sent to an modal/overlay
      if (!isInModal()) {
        e.preventDefault();
      }
    });
  }

  process(event) {
    if (event.type === "wheel") {
      this.wheel += (event.deltaX + event.deltaY) / modeMod[event.deltaMode];
      return;
    }

    const left = event.button === 0;
    const right = event.button === 2;
    this.coords[0] = (event.clientX / window.innerWidth) * 2 - 1;
    this.coords[1] = -(event.clientY / window.innerHeight) * 2 + 1;
    this.movementXY[0] += event.movementX;
    this.movementXY[1] += event.movementY;
    if (event.type === "mousedown" && left) {
      this.buttonLeft = true;
    } else if (event.type === "mousedown" && right) {
      this.buttonRight = true;
    } else if (event.type === "mouseup" && left) {
      this.buttonLeft = false;
    } else if (event.type === "mouseup" && right) {
      this.buttonRight = false;
    }
  }

  write(frame) {
    this.movementXY = [0, 0]; // deltas
    this.wheel = 0; // delta
    this.events.forEach(event => {
      this.process(event);
    });

    while (this.events.length) {
      this.events.pop();
    }

    frame.setVector2(paths.device.mouse.coords, this.coords[0], this.coords[1]);
    frame.setVector2(paths.device.mouse.movementXY, this.movementXY[0], this.movementXY[1]);
    frame.setValueType(paths.device.mouse.buttonLeft, this.buttonLeft);
    frame.setValueType(paths.device.mouse.buttonRight, this.buttonRight);
    frame.setValueType(paths.device.mouse.wheel, this.wheel);
  }
}

window.oncontextmenu = e => {
  if (!isInModal()) {
    e.preventDefault();
  }
};
