import { paths } from "../paths";
import { Pose } from "../pose";

export class OculusGoControllerDevice {
  constructor(gamepad) {
    this.gamepad = gamepad;
    this.buttonMap = [{ name: "touchpad", buttonId: 0 }, { name: "trigger", buttonId: 1 }];
    this.axisMap = [{ name: "touchpadX", axisId: 0 }, { name: "touchpadY", axisId: 1 }];

    this.rayObjectRotation = new THREE.Quaternion();
    this.selector = `#player-${gamepad.hand}-controller`;
    this.pose = new Pose();
  }

  write(frame) {
    if (this.gamepad.connected) {
      const gamepadPath = paths.device.gamepad(this.gamepad.index);

      this.gamepad.buttons.forEach((button, i) => {
        const buttonPath = gamepadPath.button(i);
        frame[buttonPath.pressed] = !!button.pressed;
        frame[buttonPath.touched] = !!button.touched;
        frame[buttonPath.value] = button.value;
      });
      this.gamepad.axes.forEach((axis, i) => {
        frame[gamepadPath.axis(i)] = axis;
      });

      this.buttonMap.forEach(button => {
        const outpath = paths.device.oculusgo.button(button.name);
        const buttonPath = gamepadPath.button(button.buttonId);
        frame[outpath.pressed] = !!frame[buttonPath.pressed];
        frame[outpath.touched] = !!frame[buttonPath.touched];
        frame[outpath.value] = frame[buttonPath.value];
      });
      this.axisMap.forEach(axis => {
        frame[paths.device.oculusgo.axis(axis.name)] = frame[gamepadPath.axis(axis.axisId)];
      });

      // TODO ideally we should just be getting pose from the gamepad
      if (!this.rayObject) {
        this.rayObject = document.querySelector(this.selector).object3D;
      }
      if (this.rayObject.updateMatricies) {
        this.rayObject.updateMatricies(false);
      } else {
        this.rayObject.updateMatrixWorld();
      }
      const rayMatrixWorld = this.rayObject.matrixWorld;
      this.rayObjectRotation.setFromRotationMatrix(rayMatrixWorld);
      this.pose.position.setFromMatrixPosition(rayMatrixWorld);
      this.pose.direction.set(0, 0, -1).applyQuaternion(this.rayObjectRotation);
      this.pose.fromOriginAndDirection(this.pose.position, this.pose.direction);
      frame[paths.device.oculusgo.pose] = this.pose;
    }
  }
}
