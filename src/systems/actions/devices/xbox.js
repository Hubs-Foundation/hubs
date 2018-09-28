import { paths } from "../paths";

export class XboxController {
  constructor(gamepad) {
    this.gamepad = gamepad;
    this.buttonMap = [
      { name: "a", buttonId: 0 },
      { name: "b", buttonId: 1 },
      { name: "x", buttonId: 2 },
      { name: "y", buttonId: 3 },
      { name: "leftBumper", buttonId: 4 },
      { name: "rightBumper", buttonId: 5 },
      { name: "leftTrigger", buttonId: 6 },
      { name: "rightTrigger", buttonId: 7 },
      { name: "back", buttonId: 8 },
      { name: "start", buttonId: 9 },
      { name: "leftJoystick", buttonId: 10 },
      { name: "rightJoystick", buttonId: 11 },
      { name: "dpadUp", buttonId: 12 },
      { name: "dpadDown", buttonId: 13 },
      { name: "dpadLeft", buttonId: 14 },
      { name: "dpadRight", buttonId: 15 }
    ];
    this.axisMap = [
      { name: "leftJoystickHorizontal", axisId: 0 },
      { name: "leftJoystickVertical", axisId: 1 },
      { name: "rightJoystickHorizontal", axisId: 2 },
      { name: "rightJoystickVertical", axisId: 3 }
    ];
  }

  write(frame) {
    if (this.gamepad.connected) {
      this.gamepad.buttons.forEach((button, i) => {
        const buttonPath = paths.device.gamepad(this.gamepad.index).button(i);
        frame[buttonPath.pressed] = !!button.pressed;
        frame[buttonPath.touched] = !!button.touched;
        frame[buttonPath.value] = button.value;
      });
      this.gamepad.axes.forEach((axis, i) => {
        frame[paths.device.gamepad(this.gamepad.index).axis(i)] = axis;
      });

      this.buttonMap.forEach(button => {
        const outpath = paths.device.xbox.button(button.name);
        frame[outpath.pressed] = !!frame[paths.device.gamepad(this.gamepad.index).button(button.buttonId).pressed];
        frame[outpath.touched] = !!frame[paths.device.gamepad(this.gamepad.index).button(button.buttonId).touched];
        frame[outpath.value] = frame[paths.device.gamepad(this.gamepad.index).button(button.buttonId).value];
      });
      this.axisMap.forEach(axis => {
        frame[paths.device.xbox.axis(axis.name)] = frame[paths.device.gamepad(this.gamepad.index).axis(axis.axisId)];
      });
    }
  }
}
