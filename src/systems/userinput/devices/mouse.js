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
  constructor(pointerLock) {
    this.events = [];
    this.coords = [0, 0]; // normalized screenspace coordinates in [(-1, 1), (-1, 1)]
    this.movementXY = [0, 0]; // deltas
    this.buttonLeft = false;
    this.buttonRight = false;
    this.buttonMiddle = false;
    this.wheel = 0; // delta

    this.isPointerLocked = false;

    const queueEvent = this.events.push.bind(this.events);
    const canvas = document.querySelector("canvas");
    this.canvas = canvas;

    canvas.addEventListener("contextmenu", e => {
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });

    ["mousedown", "wheel"].map(x => canvas.addEventListener(x, queueEvent, { passive: false }));
    ["mousemove", "mouseup"].map(x => window.addEventListener(x, queueEvent, { passive: false }));

    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;

    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

    if (pointerLock) {
      canvas.onclick = function() {
        canvas.dispatchEvent(new Event('action_hide_ui'))
        canvas.requestPointerLock();
      };
    }

    document.addEventListener('action_pointerlock',(e) => {
      console.log(`event data: ${JSON.stringify(e.detail)}`)
      console.log(JSON.stringify(e))
      if (e.detail.lock) canvas.requestPointerLock()
      else document.exitPointerLock()
    }, false);

    document.addEventListener('pointerlockchange', this.lockChangeAlert.bind(this), false);
    document.addEventListener('mozpointerlockchange', this.lockChangeAlert.bind(this), false);

    document.addEventListener(
      "wheel",
      e => {
        // Do not capture wheel events if they are being sent to an modal/overlay
        if (!isInModal() && !window.APP.preferenceScreenIsVisible) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
  }

  process(event) {
    if (event.type === "wheel") {
      this.wheel += (event.deltaX + event.deltaY) / modeMod[event.deltaMode];
      return true;
    }

    const left = event.button === 0;
    const middle = event.button === 1;
    const right = event.button === 2;
    this.coords[0] = (event.clientX / window.innerWidth) * 2 - 1;
    this.coords[1] = -(event.clientY / window.innerHeight) * 2 + 1;
    this.movementXY[0] += (event.movementX / window.innerWidth) * 2;
    this.movementXY[1] += -(event.movementY / window.innerHeight) * 2;
    if (event.type === "mousedown" && left) {
      this.mouseDownLeftThisFrame = true;
      this.buttonLeft = true;
    } else if (event.type === "mousedown" && right) {
      this.mouseDownRightThisFrame = true;
      this.buttonRight = true;
    } else if (event.type === "mousedown" && middle) {
      this.mouseDownMiddleThisFrame = true;
      this.buttonMiddle = true;
    } else if (event.type === "mouseup" && left) {
      if (this.mouseDownLeftThisFrame) {
        return false;
      }
      this.buttonLeft = false;
    } else if (event.type === "mouseup" && right) {
      if (this.mouseDownRightThisFrame) {
        return false;
      }
      this.buttonRight = false;
    } else if (event.type === "mouseup" && middle) {
      if (this.mouseDownMiddleThisFrame) {
        return false;
      }
      this.buttonMiddle = false;
    }
    return true;
  }

  lockChangeAlert() {
    const canvas = this.canvas;
    if (document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas) {
      this.isPointerLocked = true;
    } else {
      this.isPointerLocked = false;
    }
  }

  write(frame) {
    this.movementXY[0] = 0; // deltas
    this.movementXY[1] = 0; // deltas
    this.wheel = 0; // delta

    this.didStopProcessingEarly = false;
    this.mouseDownLeftThisFrame = false;
    this.mouseDownRightThisFrame = false;
    this.mouseDownMiddleThisFrame = false;

    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      if (!this.process(event)) {
        this.didStopProcessingEarly = true;
        this.events.splice(0, i);
        break;
      }
    }

    if (!this.didStopProcessingEarly) {
      this.events.length = 0;
    }

    frame.setVector2(paths.device.mouse.coords, this.coords[0], this.coords[1]);
    frame.setVector2(paths.device.mouse.movementXY, this.movementXY[0], this.movementXY[1]);
    frame.setValueType(paths.device.mouse.buttonLeft, this.buttonLeft);
    frame.setValueType(paths.device.mouse.buttonRight, this.buttonRight);
    frame.setValueType(paths.device.mouse.buttonMiddle, this.buttonMiddle);
    frame.setValueType(paths.device.mouse.wheel, this.wheel);
    frame.setValueType(paths.device.mouse.pointerLocked, this.isPointerLocked);
  }
}

window.oncontextmenu = e => {
  if (!isInModal()) {
    e.preventDefault();
  }
};
