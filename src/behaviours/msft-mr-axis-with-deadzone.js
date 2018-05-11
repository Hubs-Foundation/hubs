function msft_mr_axis_with_deadzone(el, outputPrefix) {
  this.el = el;
  this.outputPrefix = outputPrefix;
  this.deadzone = 0.01;
  this.emitAxisMoveWithDeadzone = this.emitAxisMoveWithDeadzone.bind(this);
}

msft_mr_axis_with_deadzone.prototype = {
  addEventListeners: function() {
    this.el.addEventListener("axismove", this.emitAxisMoveWithDeadzone);
  },
  removeEventListeners: function() {
    this.el.removeEventListener("axismove", this.emitAxisMoveWithDeadzone);
  },
  emitAxisMoveWithDeadzone: function(event) {
    const axis = event.detail.axis;
    if (Math.abs(axis[0]) < this.deadzone && Math.abs(axis[1]) < this.deadzone) {
      return;
    }
    // Reverse y
    axis[1] = -axis[1];
    this.el.emit("axisMoveWithDeadzone", event.detail);
  }
};

export default msft_mr_axis_with_deadzone;
