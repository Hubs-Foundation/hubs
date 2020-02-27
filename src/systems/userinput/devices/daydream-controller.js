import { paths } from "../paths";
import { Pose } from "../pose";
import { applyArmModel } from "../arm-model";
import { copySittingToStandingTransform } from "./copy-sitting-to-standing-transform";

const ONES = new THREE.Vector3(1, 1, 1);
const HAND_OFFSET = new THREE.Matrix4().makeTranslation(0, 0, -0.04);
const m = new THREE.Matrix4();

const TOUCHPAD = paths.device.daydream.button("touchpad");
const TOUCHPAD_X = paths.device.daydream.axis("touchpadX");
const TOUCHPAD_Y = paths.device.daydream.axis("touchpadY");
const POSE = paths.device.daydream.pose;
const MATRIX = paths.device.daydream.matrix;

export class DaydreamControllerDevice {
  constructor(gamepad) {
    this.gamepad = gamepad;

    this.rayObjectRotation = new THREE.Quaternion();
    this.selector = `#player-${gamepad.hand || "right"}-controller`;
    this.pose = new Pose();
    this.sittingToStandingMatrix = new THREE.Matrix4().makeTranslation(0, 1.6, 0);
    copySittingToStandingTransform(this.sittingToStandingMatrix);
    this.matrix = new THREE.Matrix4();
    this.orientation = new THREE.Quaternion();
  }

  write(frame) {
    this.gamepad = navigator.getGamepads()[0];
    if (this.gamepad && this.gamepad.connected) {
      const button = this.gamepad.buttons[0];
      frame.setValueType(TOUCHPAD.pressed, !!button.pressed);
      frame.setValueType(TOUCHPAD.touched, !!button.touched);
      frame.setValueType(TOUCHPAD.value, !!button.value);

      frame.setValueType(TOUCHPAD_X, this.gamepad.axes[0]);
      frame.setValueType(TOUCHPAD_Y, this.gamepad.axes[1]);

      // TODO ideally we should just be getting pose from the gamepad
      if (!this.rayObject) {
        this.rayObject = document.querySelector(this.selector).object3D;
      }
      this.rayObject.updateMatrixWorld();
      this.rayObjectRotation.setFromRotationMatrix(m.extractRotation(this.rayObject.matrixWorld));
      this.pose.position.setFromMatrixPosition(this.rayObject.matrixWorld);
      this.pose.direction.set(0, 0, -1).applyQuaternion(this.rayObjectRotation);
      this.pose.fromOriginAndDirection(this.pose.position, this.pose.direction);
      frame.setPose(POSE, this.pose);

      this.headObject3D = this.headObject3D || document.querySelector("#avatar-pov-node").object3D;

      if (this.gamepad.pose.orientation) {
        frame.setMatrix4(
          MATRIX,
          this.matrix
            .compose(
              applyArmModel(this.gamepad.pose, this.gamepad.hand, this.headObject3D, 1.6),
              this.orientation.fromArray(this.gamepad.pose.orientation),
              ONES
            )
            .premultiply(this.sittingToStandingMatrix)
            .multiply(HAND_OFFSET)
        );
      }
    }
  }
}
