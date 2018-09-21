import { paths } from "../paths";

export default class XboxController {
  constructor(gamepad) {
    this.gamepad = gamepad;
    this.map = [
      { name: "a", buttonId: 0 },
      { name: "b", buttonId: 1 },
      { name: "x", buttonId: 2 },
      { name: "y", buttonId: 3 }
    ];
  }

  write(frame) {
    if (this.gamepad.connected) {
      this.gamepad.buttons.forEach((button, i) => {
        const buttonPath = paths.device.gamepad(this.gamepad.index).button(i);
        frame[buttonPath.pressed] = !!button.pressed;
        frame[buttonPath.touched] = !!button.touched;
        frame[buttonPath.value] = !!button.value;
      });
      this.gamepad.axes.forEach((axis, i) => {
        frame[paths.device.gamepad(this.gamepad.index).axis(i)] = axis;
      });

      this.map.forEach(button => {
        const outpath = paths.device.xbox.button(button.name);
        frame[outpath.pressed] = !!frame[paths.device.gamepad(this.gamepad.index).button(button.buttonId).pressed];
        frame[outpath.touched] = !!frame[paths.device.gamepad(this.gamepad.index).button(button.buttonId).touched];
        frame[outpath.value] = !!frame[paths.device.gamepad(this.gamepad.index).button(button.buttonId).value];
      });
    }
  }
}
