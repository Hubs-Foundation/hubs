import { paths } from "../paths";
import { Pose } from "../pose";
import { applyArmModel } from "../arm-model.js";
import { copySittingToStandingTransform } from "./copy-sitting-to-standing-transform";

const ONES = new THREE.Vector3(1, 1, 1);

const TOUCHPAD = paths.device.gearVRController.button("touchpad");
const TRIGGER = paths.device.gearVRController.button("trigger");
const TOUCHPAD_X = paths.device.gearVRController.axis("touchpadX");
const TOUCHPAD_Y = paths.device.gearVRController.axis("touchpadY");

const m = new THREE.Matrix4();

export class GearVRControllerDevice {
  constructor(gamepad) {
    this.gamepad = gamepad;
    this.buttonMap = [{ name: "touchpad", buttonId: 0 }, { name: "trigger", buttonId: 1 }];
    this.axisMap = [{ name: "touchpadX", axisId: 0 }, { name: "touchpadY", axisId: 1 }];

    this.rayObjectRotation = new THREE.Quaternion();
    this.selector = `#player-${gamepad.hand}-controller`;
    this.pose = new Pose();
    this.sittingToStandingMatrix = new THREE.Matrix4().makeTranslation(0, 1.6, 0);
    copySittingToStandingTransform(this.sittingToStandingMatrix);

    this.matrix = new THREE.Matrix4();
    this.orientation = new THREE.Quaternion();
  }

  write(frame) {
    // Chrome requires a call to getGamepads() for the gamepad state to update.
    navigator.getGamepads();
    if (this.gamepad.connected) {
      const touchpad = this.gamepad.buttons[0];
      frame.setValueType(TOUCHPAD.pressed, !!touchpad.pressed);
      frame.setValueType(TOUCHPAD.touched, !!touchpad.touched);
      frame.setValueType(TOUCHPAD.value, !!touchpad.value);

      const trigger = this.gamepad.buttons[1];
      frame.setValueType(TRIGGER.pressed, !!trigger.pressed);
      frame.setValueType(TRIGGER.touched, !!trigger.touched);
      frame.setValueType(TRIGGER.value, !!trigger.value);

      frame.setValueType(TOUCHPAD_X, this.gamepad.axes[0]);
      frame.setValueType(TOUCHPAD_Y, this.gamepad.axes[1]);

      // TODO we should just be getting pose from the gamepad
      if (!this.rayObject) {
        this.rayObject = document.querySelector(this.selector).object3D;
      }
      this.rayObject.updateMatrixWorld();
      this.rayObjectRotation.setFromRotationMatrix(m.extractRotation(this.rayObject.matrixWorld));
      this.pose.position.setFromMatrixPosition(this.rayObject.matrixWorld);
      this.pose.direction.set(0, 0, -1).applyQuaternion(this.rayObjectRotation);
      this.pose.fromOriginAndDirection(this.pose.position, this.pose.direction);
      frame.setPose(paths.device.gearVRController.pose, this.pose);
      this.headObject3D = this.headObject3D || document.querySelector("#avatar-pov-node").object3D;
      if (this.gamepad.pose.orientation) {
        frame.setMatrix4(
          paths.device.gearVRController.matrix,
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
