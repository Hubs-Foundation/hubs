AFRAME.registerComponent("split-axis-events", {
  init: function() {
    this.pressed = false;
    this.onAxisMove = this.onAxisMove.bind(this);
    this.onButtonChanged = this.onButtonChanged.bind(this);
  },

  play: function() {
    this.el.addEventListener("axismove", this.onAxisMove);
    this.el.addEventListener("buttonchanged", this.onButtonChanged);
  },

  pause: function() {
    this.el.removeEventListener("axismove", this.onAxisMove);
    this.el.removeEventListener("buttonchanged", this.onButtonChanged);
  },

  onAxisMove: function(event) {
    var name = "touchpad" + (this.pressed ? "pressed" : "") + "axismove";
    this.el.emit(name + "x", event.detail.axis[0]);
    this.el.emit(name + "y", event.detail.axis[1]);
  },

  onButtonChanged: function(event) {
    if (this.pressed && !event.detail.state.pressed) {
      this.el.emit("touchpadbuttonup");
    }
    this.pressed = event.detail.state.pressed;
  }
});
