/*
function DPadAsAnalog2D (el, buttonName){
  this.output = [0,0];
  el.addEventListener("dpad")
};

 */

AFRAME.registerComponent("wasd-to-analog2d", {
  schema: {
    analog2dOutputAction: { default: "keyboard_dpad_axes" }
  },

  init: function() {
    this.directionsAndAxes = {
      north: [0, 1],
      northeast: [1, 1],
      east: [1, 0],
      southeast: [1, -1],
      south: [0, -1],
      southwest: [-1, -1],
      west: [-1, 0],
      northwest: [-1, 1]
    };
    this.onWasd = this.onWasd.bind(this);
  },

  play: function() {
    this.addEventListener("wasd", onWasd);
  },

  pause: function() {
    this.removeEventListener("wasd", onWasd);
  },

  onWasd: function(event) {
    console.log(event);
  },

  emitAnalog2d: function(axes) {}
});
