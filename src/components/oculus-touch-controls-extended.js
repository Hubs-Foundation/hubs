import { angleTo4Direction, angleTo8Direction } from "../utils";

AFRAME.registerComponent("oculus-touch-controls-extended", {
  schema: {
    hand: { default: "left" },
    dpad_enabled: { default: false },
    dpad_deadzone: { default: 0.85 },
    dpad_livezone: { default: 0.35 },
    dpad_directions: { default: 4 }, // one of [4, 8]
    dpad_turbo: { default: false },
    dpad_haptic_intensity: { default: "none" } // one of ["none", "low", "medium", "high"]
  },

  init: function() {
    this.filterAxisMove = this.filterAxisMove.bind(this);
    this.dpadCanFire = true;
  },

  play: function(old) {
    this.el.addEventListener("axismove", this.filterAxisMove);
  },

  pause: function(old) {
    this.el.removeEventListener("axismove", this.filterAxisMove);
  },

  filterAxisMove: function(event) {
    const x = event.detail.axis[0];
    const y = event.detail.axis[1];
    const deadzone = this.data.dpad_deadzone;
    const turbo = this.data.dpad_turbo;
    const livezone = this.data.dpad_livezone;
    const directions = this.data.dpad_directions;
    const haptic_intensity = this.data.dpad_haptic_intensity;
    const hand = this.data.hand;

    event.target.emit(`${hand}_axismove`, {
      axis: [event.detail.axis[0], -event.detail.axis[1]]
    });

    if (!this.data.dpad_enabled) {
      return;
    }
    if (!turbo && Math.abs(x) < livezone && Math.abs(y) < livezone) {
      this.dpadCanFire = true;
    }
    if (!this.dpadCanFire) return;

    const deadzoneFilteredX = Math.abs(x) < deadzone ? 0 : x;
    const deadzoneFilteredY = Math.abs(y) < deadzone ? 0 : y;
    if (deadzoneFilteredX == 0 && deadzoneFilteredY == 0) return;
    const angle = Math.atan2(deadzoneFilteredX, deadzoneFilteredY);
    const direction =
      directions === 4 ? angleTo4Direction(angle) : angleTo8Direction(angle);

    event.target.emit(`${hand}_dpad_${direction}`);
    event.target.emit(`${hand}_haptic_pulse`, { intensity: haptic_intensity });
    if (!turbo) {
      this.dpadCanFire = false;
    }
  }
});
