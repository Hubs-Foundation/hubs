/**
 * @fileOverview
 * Treats a pair of axes and a button as a dpad
 * This is useful for Vive trackpad and Oculus Touch thumbstick
 *
 * @name axis-dpad.js
 * @TODO allow use of thumbstick without press
 * @TODO make axes configurable
 */

const angleToDirection = function(angle) {
  angle = (angle * THREE.Math.RAD2DEG + 180 + 45) % 360;
  if (angle > 0 && angle < 90) {
    return "down";
  } else if (angle >= 90 && angle < 180) {
    return "left";
  } else if (angle >= 180 && angle < 270) {
    return "up";
  } else {
    return "right";
  }
};

AFRAME.registerComponent("axis-dpad", {
  schema: {
    centerZone: { default: 0.5 },
    moveEvents: { default: ["axismove"] },
    downEvents: { default: ["trackpaddown", "thumbstickdown"] },
    upEvents: { default: ["trackpadup", "thumbstickup"] }
  },

  init: function() {
    this.onAxisMove = this.onAxisMove.bind(this);
    this.onButtonPressed = this.onButtonPressed.bind(this);
    this.lastPos = [0, 0];
  },

  play: function() {
    const { moveEvents, downEvents, upEvents } = this.data;
    moveEvents.forEach(moveEvent => {
      this.el.addEventListener(moveEvent, this.onAxisMove);
    });
    downEvents.concat(upEvents).forEach(eventName => {
      this.el.addEventListener(eventName, this.onButtonPressed);
    });
  },

  pause: function() {
    const { moveEvents, downEvents, upEvents } = this.data;
    moveEvents.forEach(moveEvent => {
      this.el.removeEventListener(moveEvent, this.onAxisMove);
    });
    downEvents.concat(upEvents).forEach(eventName => {
      this.el.removeEventListener(eventName, this.onButtonPressed);
    });
  },

  onAxisMove: function(e) {
    this.lastPos = e.detail.axis;
  },

  onButtonPressed: function(e) {
    const [x, y] = this.lastPos;
    const { upEvents, centerZone } = this.data;
    const state = upEvents.includes(e.type) ? "up" : "down";
    const direction =
      state === "up" && this.lastDirection // Always trigger the up event for the last down event
        ? this.lastDirection
        : x * x + y * y < centerZone * centerZone // If within center zone angle does not matter
          ? "center"
          : angleToDirection(Math.atan2(x, y));

    const hand = e.detail.target.id === "left-hand" ? "left" : "right";
    this.el.emit(`${hand}dpad${direction}${state}`);

    if (state === "down") {
      this.lastDirection = direction;
    } else {
      delete this.lastDirection;
    }
  }
});
