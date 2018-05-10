const CARDBOARD_BUTTON = "Cardboard Button";

module.exports = AFRAME.registerComponent("cardboard-controls", {
  init: function() {
    this.buttons = {};
    this.gamepad = null;
  },

  tick: function() {
    this.gamepad = this.gamepad || this._getGamepad();
    if (this.gamepad) {
      for (var i = 0; i < this.gamepad.buttons.length; i++) {
        if (this.gamepad.buttons[i].pressed && !this.buttons[i]) {
          this.el.emit("cardboardbuttondown", {});
        } else if (!this.gamepad.buttons[i].pressed && this.buttons[i]) {
          this.el.emit("cardboardbuttonup", {});
        }
        this.buttons[i] = this.gamepad.buttons[i].pressed;
      }
    } else if (Object.keys(this.buttons)) {
      this.buttons = {};
    }
  },

  _getGamepad: function() {
    const gamepads = navigator.getGamepads && navigator.getGamepads();
    for (var i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].id === CARDBOARD_BUTTON) {
        return gamepads[i];
      }
    }
    return null;
  }
});
