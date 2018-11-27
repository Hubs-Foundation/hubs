import { paths } from "../paths";
import { Pose } from "../pose";

export class OculusGoControllerDevice {
  constructor(gamepad) {
    this.gamepad = gamepad;
    this.rayObjectRotation = new THREE.Quaternion();
    this.pose = new Pose();
  }

  write(frame) {
    if (this.gamepad.connected) {
      frame[paths.device.oculusgo.touchpad.axisX] = this.gamepad.axes[0];
      frame[paths.device.oculusgo.touchpad.axisY] = this.gamepad.axes[1];
      frame[paths.device.oculusgo.touchpad.pressed] = this.gamepad.buttons[0].pressed;
      frame[paths.device.oculusgo.touchpad.touched] = this.gamepad.buttons[0].touched;
      frame[paths.device.oculusgo.touchpad.value] = this.gamepad.buttons[0].value;
      frame[paths.device.oculusgo.trigger.pressed] = this.gamepad.buttons[1].pressed;
      frame[paths.device.oculusgo.trigger.touched] = this.gamepad.buttons[1].touched;
      frame[paths.device.oculusgo.trigger.value] = this.gamepad.buttons[1].value;

      // TODO ideally we should just be getting pose from the gamepad
      if (!this.rayObject) {
        this.rayObject = document.querySelector(`#player-${this.gamepad.hand}-controller`).object3D;
      }
      if (this.rayObject.updateMatricies) {
        this.rayObject.updateMatricies();
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
