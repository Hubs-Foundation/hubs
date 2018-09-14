import { paths } from "./paths";
import { pose } from "./pose";

// TODO: Where do these values (500, 10, 2) come from?
const modeMod = {
  [WheelEvent.DOM_DELTA_PIXEL] : 500,
  [WheelEvent.DOM_DELTA_LINE] : 10,
  [WheelEvent.DOM_DELTA_PAGE] : 2
};

let coords = [0, 0]; // normalized screenspace coordinates in [(-1, 1), (-1, 1)]
let movementXY = [0, 0]; // deltas
let buttonLeft = false;
let buttonRight = false;
let wheel = 0; // delta

function process(event) {
  if (event.type === "wheel") {
    wheel += event.deltaY / modeMod[event.deltaMode];
    return;
  }
  const left = event.button === 0;
  const right = event.button === 2;
  coords[0] = (event.clientX / window.innerWidth) * 2 - 1;
  coords[1] = -(event.clientY / window.innerHeight) * 2 + 1;
  movementXY[0] += event.movementX;
  movementXY[1] += event.movementY;
  if (event.type === "mousedown" && left) {
    buttonLeft = true;
  } else if (event.type === "mousedown" && right) {
    buttonRight = true;
  } else if (event.type === "mouseup" && left) {
    buttonLeft = false;
  } else if (event.type === "mouseup" && right) {
    buttonRight = false;
  }
}

const events = [];
export const mouse = {
  name: "mouse",
  init() {
    const canvas = document.querySelector("canvas");
    ["mousedown", "mouseup", "mousemove", "wheel"].map(x => canvas.addEventListener(x, events.push.bind(events)));
  },
  write(frame) {
    movementXY = [0, 0]; // deltas
    wheel = 0; // delta
    events.forEach(event => {
      process(event, frame);
    });
    while (events.length) {
      events.pop();
      // we pop until events is empty
      // setting events.length = 0 results in the `forEach` above to access the elements illegally on the next tick
      // setting events = [] would mean I'd need to create new event listeners for this array
    }
    frame[paths.device.mouse.coords] = coords;
    frame[paths.device.mouse.movementXY] = movementXY;
    frame[paths.device.mouse.buttonLeft] = buttonLeft;
    frame[paths.device.mouse.buttonRight] = buttonRight;
    frame[paths.device.mouse.wheel] = wheel;
  }
};

