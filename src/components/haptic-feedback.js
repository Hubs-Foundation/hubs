AFRAME.registerComponent("haptic-feedback", {
  schema: {
    hapticEventName: { default: "haptic_pulse" }
  },

  init: function() {
    this.pulse = this.pulse.bind(this);
    this.tryGetActuator = this.tryGetActuator.bind(this);
    this.tryGetActuator();
  },

  tryGetActuator() {
    var trackedControls = this.el.components["tracked-controls"];
    if (
      trackedControls &&
      trackedControls.controller &&
      trackedControls.controller.hapticActuators &&
      trackedControls.controller.hapticActuators.length > 0
    ) {
      this.actuator = trackedControls.controller.hapticActuators[0];
    } else {
      setTimeout(this.tryGetActuator, 1000);
    }
  },

  play: function() {
    this.el.addEventListener(this.data.hapticEventName, this.pulse);
  },
  pause: function() {
    this.el.removeEventListener(this.data.hapticEventName, this.pulse);
  },

  pulse: function(event) {
    let { strength, duration, intensity } = event.detail;
    switch (intensity) {
      case "low": {
        strength = 0.07;
        duration = 12;
        break;
      }
      case "medium": {
        strength = 0.2;
        duration = 12;
        break;
      }
      case "high": {
        strength = 1;
        duration = 12;
        break;
      }
      case "none": {
        return;
      }
    }

    this.actuator.pulse(strength, duration);
  }
});
