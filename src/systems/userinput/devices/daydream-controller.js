import { paths } from "../paths";
import { Pose } from "../pose";

export class DaydreamControllerDevice {
  constructor(gamepad) {
    this.gamepad = gamepad;
    this.buttonMap = [{ name: "touchpad", buttonId: 0 }];
    this.axisMap = [{ name: "touchpadX", axisId: 0 }, { name: "touchpadY", axisId: 1 }];

    this.rayObjectRotation = new THREE.Quaternion();
    this.selector = `#player-${gamepad.hand}-controller`;
    this.pose = new Pose();
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
        const outpath = paths.device.daydream.button(button.name);
        frame[outpath.pressed] = !!frame[paths.device.gamepad(this.gamepad.index).button(button.buttonId).pressed];
        frame[outpath.touched] = !!frame[paths.device.gamepad(this.gamepad.index).button(button.buttonId).touched];
        frame[outpath.value] = frame[paths.device.gamepad(this.gamepad.index).button(button.buttonId).value];
      });
      this.axisMap.forEach(axis => {
        frame[paths.device.daydream.axis(axis.name)] =
          frame[paths.device.gamepad(this.gamepad.index).axis(axis.axisId)];
      });

      // TODO ideally we should just be getting pose from the gamepad
      if (!this.rayObject) {
        this.rayObject = document.querySelector(this.selector).object3D;
      }
      this.rayObject.updateMatrixWorld();
      this.rayObjectRotation.setFromRotationMatrix(this.rayObject.matrixWorld);
      this.pose.position.setFromMatrixPosition(this.rayObject.matrixWorld);
      this.pose.direction.set(0, 0, -1).applyQuaternion(this.rayObjectRotation);
      this.pose.fromOriginAndDirection(this.pose.position, this.pose.direction);
      frame[paths.device.daydream.pose] = this.pose;
    }
  }
}
