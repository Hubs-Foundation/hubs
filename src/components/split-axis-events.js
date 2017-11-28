const angleTo4Direction = function(angle) {
  angle = (angle * THREE.Math.RAD2DEG + 180 + 45) % 360;
  if (angle > 0 && angle < 90) {
    return "north";
  } else if (angle >= 90 && angle < 180) {
    return "west";
  } else if (angle >= 180 && angle < 270) {
    return "south";
  } else {
    return "east";
  }
};

const angleTo8Direction = function(angle) {
  angle = (angle * THREE.Math.RAD2DEG + 180 + 45) % 360;
  var direction = "";
  if ((angle >= 0 && angle < 120) || angle >= 330) {
    direction += "north";
  }
  if (angle >= 150 && angle < 300) {
    direction += "south";
  }
  if (angle >= 60 && angle < 210) {
    direction += "west";
  }
  if ((angle >= 240 && angle < 360) || angle < 30) {
    direction += "east";
  }
  return direction;
};

AFRAME.registerComponent("dpad-as-axes", {
  schema: {
    inputName: { default: "dpad" },
    name: { default: "dpad_axes" },
    emitter: { default: "#left-hand" }
  },

  init: function() {
    this.mapping = [
      {
        direction: "north",
        axes: [0, 1]
      },
      {
        direction: "northeast",
        axes: [1, 1]
      },
      {
        direction: "east",
        axes: [1, 0]
      },
      {
        direction: "southeast",
        axes: [1, -1]
      },
      {
        direction: "south",
        axes: [0, -1]
      },
      {
        direction: "southwest",
        axes: [-1, -1]
      },
      {
        direction: "west",
        axes: [-1, 0]
      },
      {
        direction: "northwest",
        axes: [-1, 1]
      }
    ];
    this.handlers = [];
  },

  play: function() {
    var inputName = this.data.inputName;
    for (var pair of this.mapping) {
      this.handlers[pair.direction] = this.emitAxes(pair.axes).bind(this);
      this.el.addEventListener(
        `${inputName}_${pair.direction}`,
        this.handlers[pair.direction]
      );
    }
  },

  pause: function() {
    var inputName = this.data.inputName;
    for (var pair of this.mapping) {
      this.el.removeEventListener(
        `${inputName}_${pair.direction}`,
        this.handlers[pair.direction]
      );
    }
  },

  emitAxes: function(axes) {
    const name = this.data.name;
    const inputName = this.data.inputName;
    const emitter = document.querySelector(this.data.emitter);
    return function(event) {
      emitter.emit(name, { axis: [axes[0], axes[1]] });
    };
  }
});

AFRAME.registerComponent("wasd-dpad", {
  schema: {
    north: { default: "w" },
    east: { default: "d" },
    south: { default: "s" },
    west: { default: "a" }
  },

  init: function() {
    this.onKeyPress = this.onKeyPress.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.keys = {};
  },

  play: function() {
    window.addEventListener("keypress", this.onKeyPress);
    window.addEventListener("keyup", this.onKeyUp);
  },

  pause: function() {
    window.remove("keypress", this.onKeyPress);
    window.remove("keyup", this.onKeyUp);
  },

  tick: function(t, dt) {
    const { north, east, south, west } = this.data;
    var direction = "";
    direction += this.keys[north] ? "north" : "";
    direction += this.keys[south] ? "south" : "";
    direction += this.keys[east] ? "east" : "";
    direction += this.keys[west] ? "west" : "";
    if (direction !== "") {
      this.el.emit(`dpad_${direction}`);
    }
  },

  onKeyPress: function(event) {
    const { north, east, south, west } = this.data;
    for (var dir of [north, south, east, west]) {
      if (event.key === dir) {
        this.keys[dir] = true;
      }
    }
  },

  onKeyUp: function(event) {
    const { north, east, south, west } = this.data;
    for (var dir of [north, south, east, west]) {
      if (event.key === dir) {
        this.keys[dir] = false;
      }
    }
  }
});

AFRAME.registerComponent("oculus-touch-controls-extended", {
  schema: {
    hand: { default: "left" },
    dpad: { default: false },
    dpad_deadzone: { default: 0.85 },
    dpad_livezone: { default: 0.35 },
    dpad_directions: { default: 4 }, // one of [4, 8]
    dpad_turbo: { default: false },
    dpad_haptic_intensity: { default: "none" } // one of ["none", "low", "mid", "high"]
  },

  init: function() {
    this.axisToDpad = this.axisToDpad.bind(this);
    this.dpadCanFire = true;
  },

  update: function(old) {
    if (old.dpad && !this.data.dpad) {
      this.el.removeEventListener("axismove", this.axisToDpad);
    }
    if (!old.dpad && this.data.dpad) {
      this.el.addEventListener("axismove", this.axisToDpad);
    }
  },

  axisToDpad: function(event) {
    var x = event.detail.axis[0];
    var y = event.detail.axis[1];
    var deadzone = this.data.dpad_deadzone;
    var turbo = this.data.dpad_turbo;
    var livezone = this.data.dpad_livezone;
    var directions = this.data.dpad_directions;
    var haptic_intensity = this.data.dpad_haptic_intensity;
    var hand = this.data.hand;

    event.target.emit(`${hand}_axismove`, {
      axis: [event.detail.axis[0], -event.detail.axis[1]]
    });

    if (!turbo && Math.abs(x) < livezone && Math.abs(y) < livezone) {
      this.dpadCanFire = true;
    }
    if (!this.dpadCanFire) return;

    x = Math.abs(x) < deadzone ? 0 : x;
    y = Math.abs(y) < deadzone ? 0 : y;
    if (x == 0 && y == 0) return;
    var angle = Math.atan2(x, y);
    var direction =
      directions === 4 ? angleTo4Direction(angle) : angleTo8Direction(angle);

    event.target.emit(`${hand}_dpad_${direction}`);
    event.target.emit(`${hand}_haptic_pulse`, { intensity: haptic_intensity });
    if (!turbo) {
      this.dpadCanFire = false;
    }
  }
});

AFRAME.registerComponent("haptic-feedback", {
  schema: {
    hand: { default: "left" }
  },

  init: function() {
    this.pulse = this.pulse.bind(this);
    this.tryGetActuator = this.tryGetActuator.bind(this);
    this.tryGetActuator();
  },

  tryGetActuator() {
    var trackedControls = this.el.components["tracked-controls"];
    if (trackedControls && trackedControls.controller) {
      this.actuator = trackedControls.controller.hapticActuators[0];
    } else {
      setTimeout(this.tryGetActuator, 1000);
    }
  },

  play: function() {
    this.el.addEventListener(`${this.data.hand}_haptic_pulse`, this.pulse);
  },
  pause: function() {
    this.el.removeEventListener(`${this.data.hand}_haptic_pulse`, this.pulse);
  },

  pulse: function(event) {
    let { strength, duration, intensity } = event.detail;
    if (intensity === "low") {
      strength = 0.07;
      duration = 12;
    }
    if (intensity === "medium") {
      strength = 0.2;
      duration = 12;
    }
    if (intensity === "high") {
      strength = 1;
      duration = 12;
    }
    if (intensity === "none") {
      return;
    }

    this.actuator.pulse(strength, duration);
  }
});

AFRAME.registerComponent("vive-controls-extended", {
  schema: {
    hand: { default: "left" },
    dpad: { default: false },
    dpad_livezone: { default: 0.3 },
    dpad_deadzone: { default: 0.8 },
    dpad_directions: { default: 4 },
    dpad_turbo: { default: true },
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
    var x = event.detail.axis[0];
    var y = event.detail.axis[1];
    this.lastSeenAxes = [x, y];
    var hand = this.data.hand;
    const axisMoveEvent = `${hand}_trackpad${this.trackpadPressed
      ? "_pressed"
      : ""}_axismove`;
    this.el.emit(axisMoveEvent, {
      axis: [x, y]
    });

    var deadzone = this.data.dpad_deadzone;
    var turbo = this.data.dpad_turbo;
    var pressedTurbo = this.data.dpad_pressed_turbo;
    var livezone = this.data.dpad_livezone;
    var directions = this.data.dpad_directions;
    var hapticIntensity = this.data.dpad_haptic_intensity;
    var pressedHapticIntensity = this.data.dpad_pressed_haptic_intensity;

    if (!turbo && Math.abs(x) < livezone && Math.abs(y) < livezone) {
      this.dpadCanFire = true;
    }

    event.target.emit(`${hand}_haptic_pulse`, {
      intensity: this.trackpadPressed ? pressedHapticIntensity : hapticIntensity
    });

    x = Math.abs(x) < deadzone ? 0 : x;
    y = Math.abs(y) < deadzone ? 0 : y;
    if (x == 0 && y == 0) return;
    var angle = Math.atan2(x, y);
    var direction =
      directions === 4 ? angleTo4Direction(angle) : angleTo8Direction(angle);

    if (!this.trackpadPressed && !this.dpadCanFire) {
      return;
    }
    if (this.trackpadPressed && !this.dpadPressedCanFire) {
      return;
    }
    var dpadEvent = `${hand}_trackpad_dpad${this.trackpadPressed
      ? "_pressed"
      : ""}_${direction}`;
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
