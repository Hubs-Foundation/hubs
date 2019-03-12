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
    hapticEventName: { default: "haptic_pulse" },
    path: { type: "string" }
  },

  init: function() {
    this.handlePulse = this.handlePulse.bind(this);
  },

  tick: function() {
    this.actuator = AFRAME.scenes[0].systems.userinput.get(this.data.path);
  },

  play: function() {
    this.el.addEventListener(this.data.hapticEventName, this.handlePulse);
  },
  pause: function() {
    this.el.removeEventListener(this.data.hapticEventName, this.handlePulse);
  },

  handlePulse: function(event) {
    if (!this.actuator) {
      return;
    }
    const { intensity } = event.detail;

    if (strengthForIntensity[intensity]) {
      this.actuator.pulse(strengthForIntensity[intensity], 15);
    } else if (Number(intensity) === intensity) {
      this.actuator.pulse(intensity, 15);
    } else {
      console.warn(`Invalid intensity : ${intensity}`);
    }
  }
});
