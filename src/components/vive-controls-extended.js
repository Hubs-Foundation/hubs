import { angleTo4Direction, angleTo8Direction } from "../utils";

AFRAME.registerComponent("vive-controls-extended", {
  schema: {
    hand: { type: "string" },
    dpad_enabled: { default: false },
    dpad_livezone: { default: 0.3 },
    dpad_deadzone: { default: 0.7 },
    dpad_directions: { default: 4 },
    dpad_turbo: { default: false },
    dpad_pressed_turbo: { default: false },
    center_zone: { default: 0.3 },
    dpad_haptic_intensity: { default: "none" },
    dpad_pressed_haptic_intensity: { default: "none" }
  },

  init: function() {
    this.dpadCanFire = true;
    this.dpadPressedCanFire = true;
    this.trackpadPressed = false;
    this.onAxisMove = this.onAxisMove.bind(this);
    this.lastSeenAxes = [0, 0];
    this.onButtonChanged = this.onButtonChanged.bind(this);
  },

  play: function() {
    this.el.addEventListener("axismove", this.onAxisMove);
    this.el.addEventListener("trackpadchanged", this.onButtonChanged);
  },

  pause: function() {
    this.el.removeEventListener("axismove", this.onAxisMove);
    this.el.removeEventListener("trackpadchanged", this.onButtonChanged);
  },

  onAxisMove: function(event) {
    const x = event.detail.axis[0];
    const y = event.detail.axis[1];
    this.lastSeenAxes = [x, y];
    const hand = this.data.hand;
    const pressed = this.trackpadPressed ? "_pressed" : "";
    const axisMoveEvent = `${hand}_trackpad${pressed}_axismove`;
    this.el.emit(axisMoveEvent, {
      axis: [x, y]
    });

    const deadzone = this.data.dpad_deadzone;
    const turbo = this.data.dpad_turbo;
    const pressedTurbo = this.data.dpad_pressed_turbo;
    const livezone = this.data.dpad_livezone;
    const directions = this.data.dpad_directions;
    const hapticIntensity = this.data.dpad_haptic_intensity;
    const pressedHapticIntensity = this.data.dpad_pressed_haptic_intensity;

    if (!turbo && Math.abs(x) < livezone && Math.abs(y) < livezone) {
      this.dpadCanFire = true;
    }

    event.target.emit(`${hand}_haptic_pulse`, {
      intensity: this.trackpadPressed ? pressedHapticIntensity : hapticIntensity
    });

    const deadzoneFilteredX = Math.abs(x) < deadzone ? 0 : x;
    const deadzoneFilteredY = Math.abs(y) < deadzone ? 0 : y;
    if (deadzoneFilteredX == 0 && deadzoneFilteredY == 0) return;
    const angle = Math.atan2(deadzoneFilteredX, deadzoneFilteredY);
    const direction =
      directions === 4 ? angleTo4Direction(angle) : angleTo8Direction(angle);

    if (!this.trackpadPressed && !this.dpadCanFire) {
      return;
    }
    if (this.trackpadPressed && !this.dpadPressedCanFire) {
      return;
    }
    const dpadEvent = `${hand}_trackpad_dpad${pressed}_${direction}`;
    event.target.emit(dpadEvent);

    if (!this.trackpadPressed && !turbo) {
      this.dpadCanFire = false;
    } else if (this.trackpadPressed && !pressedTurbo) {
      this.dpadPressedCanFire = false;
    }
  },

  onButtonChanged: function(event) {
    const x = this.lastSeenAxes[0];
    const y = this.lastSeenAxes[1];
    const hand = this.data.hand;
    const centerZone = this.data.center_zone;
    const down = !this.trackpadPressed && event.detail.pressed;
    const up = this.trackpadPressed && !event.detail.pressed;
    const center =
      Math.abs(x) < centerZone && Math.abs(y) < centerZone ? "_center" : "";
    const eventName = `${hand}_trackpad${center}${up ? "_up" : ""}${down
      ? "_down"
      : ""}`;
    this.el.emit(eventName);
    if (up) {
      this.dpadPressedCanFire = true;
    }

    this.trackpadPressed = event.detail.pressed;
  }
});
