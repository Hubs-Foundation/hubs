import { paths } from "../paths";

export class GamepadDevice {
  constructor(gamepad) {
    this.gamepad = gamepad;
  }

  write(frame) {
    if (this.gamepad.connected) {
      this.gamepad.buttons.forEach((button, i) => {
        const buttonPath = paths.device.gamepad(this.gamepad.index).button(i);
        frame.setValueType(buttonPath.pressed, !!button.pressed);
        frame.setValueType(buttonPath.touched, !!button.touched);
        frame.setValueType(buttonPath.value, button.value);
      });
      this.gamepad.axes.forEach((axis, i) => {
        frame.setValueType(paths.device.gamepad(this.gamepad.index).axis(i), axis);
      });
    }
  }
}
