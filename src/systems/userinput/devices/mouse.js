import { paths } from "../paths";

// TODO: Where do these values (500, 10, 2) come from?
const modeMod = {
  [WheelEvent.DOM_DELTA_PIXEL]: 500,
  [WheelEvent.DOM_DELTA_LINE]: 10,
  [WheelEvent.DOM_DELTA_PAGE]: 2
};

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
    ["mousedown", "mouseup", "mousemove", "wheel"].map(x => canvas.addEventListener(x, queueEvent));
    ["mouseout", "blur"].map(x => document.addEventListener(x, queueEvent));
  }

  process(event) {
    if (event.type === "wheel") {
      this.wheel += event.deltaY / modeMod[event.deltaMode];
      return;
    }
    if (event.type === "mouseout" || event.type === "blur") {
      this.coords[0] = 0;
      this.coords[1] = 0;
      this.movementXY[0] = 0;
      this.movementXY[1] = 0;
      this.buttonLeft = false;
      this.buttonRight = false;
      this.wheel = 0;
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
      this.process(event, frame);
    });

    while (this.events.length) {
      this.events.pop();
    }

    frame[paths.device.mouse.coords] = this.coords;
    frame[paths.device.mouse.movementXY] = this.movementXY;
    frame[paths.device.mouse.buttonLeft] = this.buttonLeft;
    frame[paths.device.mouse.buttonRight] = this.buttonRight;
    frame[paths.device.mouse.wheel] = this.wheel;
  }
}

window.oncontextmenu = e => {
  e.preventDefault();
};
