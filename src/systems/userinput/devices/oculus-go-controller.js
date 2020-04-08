import { paths } from "../paths";
import { Pose } from "../pose";
import { applyArmModel } from "../arm-model.js";
import { copySittingToStandingTransform } from "./copy-sitting-to-standing-transform";
import { waitForDOMContentLoaded } from "../../../utils/async-utils";

const ONES = new THREE.Vector3(1, 1, 1);
const m = new THREE.Matrix4();

const TOUCHPAD = paths.device.oculusgo.touchpad;
const TRIGGER = paths.device.oculusgo.trigger;

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

    // TODO ideally we should just be getting pose from the gamepad
    // TODO if controller is set to left hand, we still use right hand query here
    // because otherwise things break.
    waitForDOMContentLoaded().then(() => {
      this.rayObject = document.querySelector("#player-right-controller").object3D;
      this.headObject3D = document.querySelector("#avatar-pov-node").object3D;
    });

    navigator.getGamepads();
  }

  write(frame) {
    if (!this.rayObject || !this.headObject3D) return;

    // Have to call navigator.getGamepads() in order for the gamepad object to update.
    navigator.getGamepads();
    if (this.gamepad.connected) {
      frame.setValueType(TOUCHPAD.axisX, this.gamepad.axes[0]);
      frame.setValueType(TOUCHPAD.axisY, this.gamepad.axes[1]);
      frame.setValueType(TOUCHPAD.pressed, this.gamepad.buttons[0].pressed);
      frame.setValueType(TOUCHPAD.touched, this.gamepad.buttons[0].touched);
      frame.setValueType(TOUCHPAD.value, this.gamepad.buttons[0].value);
      frame.setValueType(TRIGGER.pressed, this.gamepad.buttons[1].pressed);
      frame.setValueType(TRIGGER.touched, this.gamepad.buttons[1].touched);
      frame.setValueType(TRIGGER.value, this.gamepad.buttons[1].value);

      this.rayObject.updateMatrices();
      this.rayObject.getWorldQuaternion(this.q);
      frame.setValueType(paths.actions.rayObjectRotation, this.q);
      const rayMatrixWorld = this.rayObject.matrixWorld;
      this.rayObjectRotation.setFromRotationMatrix(m.extractRotation(this.rayObject.matrixWorld));

      this.pose.position.setFromMatrixPosition(rayMatrixWorld);
      this.pose.direction.set(0, 0, -1).applyQuaternion(this.rayObjectRotation);
      this.pose.fromOriginAndDirection(this.pose.position, this.pose.direction);
      frame.setPose(paths.device.oculusgo.pose, this.pose);

      if (this.gamepad.pose.orientation) {
        // TODO if controller is set to left hand, we still draw right hand until
        // bindings are overhauled to handle primary/secondary hands.
        frame.setMatrix4(
          paths.device.oculusgo.matrix,
          this.matrix
            .compose(
              applyArmModel(this.gamepad.pose, this.gamepad.hand, this.headObject3D, 1.6),
              this.orientation.fromArray(this.gamepad.pose.orientation),
              ONES
            )
            .premultiply(this.sittingToStandingMatrix)
        );
      }
    }
  }
}
