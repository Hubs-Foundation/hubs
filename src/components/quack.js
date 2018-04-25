AFRAME.registerComponent("quack", {
  schema: {
    quackPercentage: { default: 1 },
    specialQuackPercentage: { default: 0.01 }
  },

  init: function() {
    this._handleGrabStart = this._handleGrabStart.bind(this);
  },

  play: function() {
    this.el.addEventListener("grab-start", this._handleGrabStart);
  },

  pause: function() {
    this.el.removeEventListener("grab-start", this._handleGrabStart);
  },

  _handleGrabStart: function() {
    const rand = Math.random();
    if (rand < this.data.specialQuackPercentage) {
      this.el.emit("specialquack");
    } else if (rand < this.data.quackPercentage) {
      this.el.emit("quack");
    }
  }
});
