import { angleTo4Direction } from "../utils/dpad";

// @TODO specify 4 or 8 direction
function joystick_dpad4(el, outputPrefix) {
  this.angleToDirection = angleTo4Direction;
  this.outputPrefix = outputPrefix;
  this.centerRadius = 0.6;
  this.previous = "none";
  this.hapticIntensity = "low";
  this.emitDPad4 = this.emitDPad4.bind(this);
  this.el = el;
}

joystick_dpad4.prototype = {
  addEventListeners: function() {
    this.el.addEventListener("axismove", this.emitDPad4);
  },
  removeEventListeners: function() {
    this.el.removeEventListener("axismove", this.emitDPad4);
  },
  emitDPad4: function(event) {
    const x = event.detail.axis[0];
    const y = event.detail.axis[1];
    const inCenter = Math.abs(x) < this.centerRadius && Math.abs(y) < this.centerRadius;
    const current = inCenter ? "center" : this.angleToDirection(Math.atan2(x, -y));
    if (current !== this.previous) {
      this.previous = current;
      event.target.emit(`${this.outputPrefix}_dpad4_${current}`);
      event.target.emit("haptic_pulse", { intensity: this.hapticIntensity });
    }
  }
};

export default joystick_dpad4;
