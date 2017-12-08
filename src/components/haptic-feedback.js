const strengthForIntensity = {
  low: 0.07,
  medium: 0.2,
  high: 1
};

AFRAME.registerComponent("haptic-feedback", {
  schema: {
    hapticEventName: { default: "haptic_pulse" }
  },

  init: function() {
    this.pulse = this.pulse.bind(this);
    this.getActuator = this.getActuator.bind(this);
    this.getActuator().then(actuator => {
      this.actuator = actuator;
    });
  },

  getActuator() {
    return new Promise((resolve, reject) => {
      const tryGetActivator = () => {
        var trackedControls = this.el.components["tracked-controls"];
        if (
          trackedControls &&
          trackedControls.controller &&
          trackedControls.controller.hapticActuators &&
          trackedControls.controller.hapticActuators.length
        ) {
          resolve(trackedControls.controller.hapticActuators[0]);
        } else {
          setTimeout(tryGetActivator, 1000);
        }
      };
      setTimeout(tryGetActivator, 1000);
    });
  },

  play: function() {
    this.el.addEventListener(this.data.hapticEventName, this.pulse);
  },
  pause: function() {
    this.el.removeEventListener(this.data.hapticEventName, this.pulse);
  },

  pulse: function(event) {
    let { intensity } = event.detail;
    if (!strengthForIntensity[intensity]) {
      console.warn(`Invalid intensity : ${intensity}`);
      return;
    }

    if (this.actuator) {
      this.actuator.pulse(strengthForIntensity[intensity], 15);
    }
  }
});
