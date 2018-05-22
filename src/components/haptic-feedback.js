const strengthForIntensity = {
  low: 0.07,
  medium: 0.2,
  high: 1
};

/**
 * Listens for haptic events and actuates hardware controllers accordingly
 * @namespace user-input
 * @component haptic-feedback
 */
AFRAME.registerComponent("haptic-feedback", {
  schema: {
    hapticEventName: { default: "haptic_pulse" }
  },

  init: function() {
    this.handlePulse = this.handlePulse.bind(this);
    this.getActuator = this.getActuator.bind(this);
    this.getActuator().then(actuator => {
      this.actuator = actuator;
    });
  },

  getActuator() {
    return new Promise(resolve => {
      const tryGetActivator = () => {
        const trackedControls = this.el.components["tracked-controls"];
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
    this.el.addEventListener(this.data.hapticEventName, this.handlePulse);
  },
  pause: function() {
    this.el.removeEventListener(this.data.hapticEventName, this.handlePulse);
  },

  handlePulse: function(event) {
    const { intensity } = event.detail;

    if (strengthForIntensity[intensity]) {
      this.pulse(strengthForIntensity[intensity]);
    } else if (Number(intensity) === intensity) {
      this.pulse(intensity);
    } else {
      console.warn(`Invalid intensity : ${intensity}`);
    }
  },

  pulse: function(intensity) {
    if (this.actuator) {
      this.actuator.pulse(intensity, 15);
    }
  }
});
