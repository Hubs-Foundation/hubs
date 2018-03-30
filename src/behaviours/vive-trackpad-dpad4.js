import { angleTo4Direction, angleTo8Direction } from "../utils/dpad";

function vive_trackpad_dpad4(el, outputPrefix) {
  this.outputPrefix = outputPrefix;
  this.lastDirection = "";
  this.previous = "";
  this.pressed = false;
  this.emitDPad4 = this.emitDPad4.bind(this);
  this.press = this.press.bind(this);
  this.unpress = this.unpress.bind(this);
  this.hapticIntensity = "low";
  this.centerRadius = 0.6;
  el.addEventListener("axismove", this.emitDPad4);
  el.addEventListener("trackpaddown", this.press);
  el.addEventListener("trackpadup", this.unpress);
}

vive_trackpad_dpad4.prototype = {
  press: function(_) {
    this.pressed = true;
  },
  unpress: function(_) {
    this.pressed = false;
  },
  emitDPad4: function(event) {
    const x = event.detail.axis[0];
    const y = event.detail.axis[1];
    const inCenter = Math.abs(x) < this.centerRadius && Math.abs(y) < this.centerRadius;
    const direction = inCenter ? "center" : angleTo4Direction(Math.atan2(x, -y));
    const pressed = this.pressed ? "pressed_" : "";
    const current = `${pressed + direction}`; // e.g. "pressed_north"

    // Real axismove events are not perfectly [0,0]...
    // This is a touchend event.
    if (x === 0 && y === 0) {
      event.target.emit(`${this.outputPrefix}_dpad4_${this.previous}_up`);
      this.previous = ""; // Clear this because the user has lifted their finger.
      return;
    }

    if (current === this.previous) {
      return;
    }

    if (this.previous !== "") {
      event.target.emit(`${this.outputPrefix}_dpad4_${this.previous}_up`);
    }

    event.target.emit(`${this.outputPrefix}_dpad4_${current}_down`);
    this.previous = current;
  }
};

export { vive_trackpad_dpad4 };
