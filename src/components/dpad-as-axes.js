AFRAME.registerComponent("dpad-as-axes", {
  schema: {
    dpadActionPrefix: { default: "dpad" },
    analog2dOutputAction: { default: "keyboard_dpad_axes" },
    emitter: { default: "#left-hand" }
  },

  init: function() {
    this.handlers = [];
    this.directionsAndAxes = [
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
  },

  play: function() {
    const inputAction = this.data.dpadActionPrefix;
    for (var tuple of this.directionsAndAxes) {
      this.handlers[tuple.direction] = this.emitAnalog2d(tuple.axes).bind(this);
      this.el.addEventListener(
        `${inputAction}_${tuple.direction}`,
        this.handlers[tuple.direction]
      );
    }
  },

  pause: function() {
    const inputAction = this.data.dpadActionPrefix;
    for (var tuple of this.directionsAndAxes) {
      this.el.removeEventListener(
        `${inputAction}_${tuple.direction}`,
        this.handlers[tuple.direction]
      );
    }
  },

  emitAnalog2d: function(axes) {
    const outputAction = this.data.analog2dOutputAction;
    const emitter = document.querySelector(this.data.emitter);
    return function(event) {
      emitter.emit(outputAction, { axis: [axes[0], axes[1]] });
    };
  }
});
