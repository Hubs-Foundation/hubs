/// Listens to four keyboard events, then emits dpad events.
AFRAME.registerComponent("keyboard-dpad", {
  schema: {
    north: { default: "w" },
    east: { default: "d" },
    south: { default: "s" },
    west: { default: "a" },
    dpadActionPrefix: { type: "string" }
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
    const { north, east, south, west, dpadActionPrefix } = this.data;
    var direction = "";
    direction += this.keys[north] ? "north" : "";
    direction += this.keys[south] ? "south" : "";
    direction += this.keys[east] ? "east" : "";
    direction += this.keys[west] ? "west" : "";
    if (direction !== "") {
      this.el.emit(`${dpadActionPrefix}_${direction}`);
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
