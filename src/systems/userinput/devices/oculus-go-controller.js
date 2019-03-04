import { paths } from "../paths";
import { Pose } from "../pose";
import { applyArmModel } from "../arm-model.js";
import { copySittingToStandingTransform } from "./copy-sitting-to-standing-transform";

const ONES = new THREE.Vector3(1, 1, 1);

export class OculusGoControllerDevice {
  constructor(gamepad) {
    this.gamepad = gamepad;
    this.rayObjectRotation = new THREE.Quaternion();
    this.pose = new Pose();
    this.q = new THREE.Quaternion();
    this.sittingToStandingMatrix = new THREE.Matrix4().makeTranslation(0, 1.6, 0);
    copySittingToStandingTransform(this.sittingToStandingMatrix);
    this.matrix = new THREE.Matrix4();
    this.orientation = new THREE.Quaternion();
  }

  write(frame) {
    // Have to call navigator.getGamepads() in order for the gamepad object to update.
    navigator.getGamepads();
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
      this.rayObject.updateMatrices();
      this.rayObject.getWorldQuaternion(this.q);
      frame[paths.actions.rayObjectRotation] = this.q;
      const rayMatrixWorld = this.rayObject.matrixWorld;
      this.rayObjectRotation.setFromRotationMatrix(rayMatrixWorld);
      this.pose.position.setFromMatrixPosition(rayMatrixWorld);
      this.pose.direction.set(0, 0, -1).applyQuaternion(this.rayObjectRotation);
      this.pose.fromOriginAndDirection(this.pose.position, this.pose.direction);
      frame[paths.device.oculusgo.pose] = this.pose;

      this.headObject3D = this.headObject3D || document.querySelector("#player-camera").object3D;

      if (this.gamepad.pose.orientation) {
        frame[paths.device.oculusgo.matrix] = this.matrix
          .compose(
            applyArmModel(this.gamepad.pose, this.gamepad.hand, this.headObject3D, 1.6),
            this.orientation.fromArray(this.gamepad.pose.orientation),
            ONES
          )
          .premultiply(this.sittingToStandingMatrix);
      }
    }
  }
}
