import { paths } from "../paths";

export class XboxControllerDevice {
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
      this.buttonMap.forEach(b => {
        const path = paths.device.xbox.button(b.name);
        const button = this.gamepad.buttons[b.buttonId];
        frame.setValueType(path.pressed, !!button.pressed);
        frame.setValueType(path.touched, !!button.touched);
        frame.setValueType(path.value, button.value);
      });
      this.axisMap.forEach(axis => {
        frame.setValueType(paths.device.xbox.axis(axis.name), this.gamepad.axes[axis.axisId]);
      });

      if (this.gamepad.hapticActuators && this.gamepad.hapticActuators[0]) {
        frame.setValueType(paths.haptics.actuators[this.gamepad.hand], this.gamepad.hapticActuators[0]);
      }
    }
  }
}
