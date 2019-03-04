const CARDBOARD_BUTTON_GAMEPAD_ID = "Cardboard Button";

/**
 * Polls the Gamepad API for Cardboard Button input and emits cardboardbutton events.
 * @namespace user-input
 * @component cardboard-controls
 */
module.exports = AFRAME.registerComponent("cardboard-controls", {
  init: function() {
    this.buttons = {};
    this.gamepad = null;
    this.isMobile = AFRAME.utils.device.isMobile();
    this.isVR = false;

    this._handleEnterVR = this._handleEnterVR.bind(this);
    this._handleExitVR = this._handleExitVR.bind(this);
  },

  play: function() {
    window.addEventListener("enter-vr", this._handleEnterVR);
    window.addEventListener("exit-vr", this._handleExitVR);
  },

  pause: function() {
    window.removeEventListener("enter-vr", this._handleEnterVR);
    window.removeEventListener("exit-vr", this._handleExitVR);
  },

  tick: function() {
    if (!this.inVR || !this.isMobile) {
      return;
    }

    this.gamepad = this.gamepad || this._getGamepad();
    if (this.gamepad) {
      for (let i = 0; i < this.gamepad.buttons.length; i++) {
        if (this.gamepad.buttons[i].pressed && !this.buttons[i]) {
          this.el.emit("cardboardbuttondown", {});
        } else if (!this.gamepad.buttons[i].pressed && this.buttons[i]) {
          this.el.emit("cardboardbuttonup", {});
        }
        this.buttons[i] = this.gamepad.buttons[i].pressed;
      }
    } else if (Object.keys(this.buttons).length) {
      this.buttons = {};
    }
  },

  _getGamepad: function() {
    if (!navigator.getGamepads) {
      return null;
    }

    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].id === CARDBOARD_BUTTON_GAMEPAD_ID) {
        return gamepads[i];
      }
    }
    return null;
  },

  _handleEnterVR: function() {
    this.inVR = true;
  },

  _handleExitVR: function() {
    this.inVR = false;
  }
});
