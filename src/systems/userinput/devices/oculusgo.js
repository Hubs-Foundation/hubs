import { paths } from "../paths";

export class OculusGoController {
  constructor(gamepad) {
    this.gamepad = gamepad;
    this.buttonMap = [{ name: "touchpad", buttonId: 0 }, { name: "trigger", buttonId: 7 }];
    this.axisMap = [{ name: "touchpadX", axisId: 0 }, { name: "touchpadY", axisId: 1 }];
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

      const touchpadPath = paths.device.oculusgo.button("touchpad");
      frame[touchpadPath.pressed] = !!frame[paths.device.gamepad(this.gamepad.index).button(6).pressed];
      frame[touchpadPath.touched] = !!(
        frame[paths.device.gamepad(this.gamepad.index).axis(0)] ||
        frame[paths.device.gamepad(this.gamepad.index).axis(1)]
      );
      frame[touchpadPath.value] = frame[paths.device.gamepad(this.gamepad.index).button(6).value];

      const triggerPath = paths.device.oculusgo.button("trigger");
      frame[triggerPath.pressed] = !!frame[paths.device.gamepad(this.gamepad.index).button(7).pressed];
      frame[triggerPath.touched] = !!frame[paths.device.gamepad(this.gamepad.index).button(7).touched];
      frame[triggerPath.value] = frame[paths.device.gamepad(this.gamepad.index).button(7).value];

      this.axisMap.forEach(axis => {
        frame[paths.device.oculusgo.axis(axis.name)] =
          frame[paths.device.gamepad(this.gamepad.index).axis(axis.axisId)];
      });
    }
  }
}
