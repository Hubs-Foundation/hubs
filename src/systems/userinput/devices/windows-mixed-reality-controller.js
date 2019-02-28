import { paths } from "../paths";
import { Pose } from "../pose";
import { copySittingToStandingTransform } from "./copy-sitting-to-standing-transform";
const ONES = new THREE.Vector3(1, 1, 1);
const HAND_OFFSET = new THREE.Matrix4().compose(
  new THREE.Vector3(0, -0.017, 0.13),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(-40 * THREE.Math.DEG2RAD, 0, 0)),
  new THREE.Vector3(1, 1, 1)
);

export class WindowsMixedRealityControllerDevice {
  constructor(gamepad) {
    this.rayObject = null;
    this.rayObjectRotation = new THREE.Quaternion();

    // wake the gamepad api up. otherwise it does not report touch controllers.
    // in chrome it still won't unless you enter vr.
    navigator.getVRDisplays();

    this.gamepad = gamepad;
    this.pose = new Pose();

    if (gamepad.hand) {
      this.selector = `#player-${gamepad.hand}-controller`;
    }

    this.sittingToStandingMatrix = new THREE.Matrix4().makeTranslation(0, 1.6, 0);
    copySittingToStandingTransform(this.sittingToStandingMatrix);
    this.matrix = new THREE.Matrix4();
    this.position = new THREE.Vector3();
    this.orientation = new THREE.Quaternion();
  }
  write(frame) {
    if (!this.gamepad.connected) return;

    const path = paths.device.wmr[this.gamepad.hand || "right"];

    frame[path.touchpad.pressed] = this.gamepad.buttons[0].pressed;
    frame[path.touchpad.touched] = this.gamepad.buttons[0].touched;
    frame[path.touchpad.value] = this.gamepad.buttons[0].value;

    frame[path.trigger.pressed] = this.gamepad.buttons[1].pressed;
    frame[path.trigger.touched] = this.gamepad.buttons[1].touched;
    frame[path.trigger.value] = this.gamepad.buttons[1].value;

    frame[path.grip.pressed] = this.gamepad.buttons[2].pressed;
    frame[path.grip.touched] = this.gamepad.buttons[2].touched;
    frame[path.grip.value] = this.gamepad.buttons[2].value;

    frame[path.menu.pressed] = this.gamepad.buttons[3].pressed;
    frame[path.menu.touched] = this.gamepad.buttons[3].touched;
    frame[path.menu.value] = this.gamepad.buttons[3].value;

    frame[path.touchpad.axisX] = this.gamepad.axes[0];
    frame[path.touchpad.axisY] = this.gamepad.axes[1];
    frame[path.joystick.axisX] = this.gamepad.axes[2];
    frame[path.joystick.axisY] = this.gamepad.axes[3];

    if (!this.selector) {
      if (!this.gamepad.hand) return;
      this.selector = `#player-${this.gamepad.hand}-controller`;
    }

    this.rayObject = this.rayObject || document.querySelector(this.selector).object3D;
    this.rayObject.updateMatrixWorld();
    this.rayObjectRotation.setFromRotationMatrix(this.rayObject.matrixWorld);

    this.pose.position.setFromMatrixPosition(this.rayObject.matrixWorld);
    this.pose.direction.set(0, 0, -1).applyQuaternion(this.rayObjectRotation);
    this.pose.fromOriginAndDirection(this.pose.position, this.pose.direction);
    frame[path.pose] = this.pose;

    if (this.gamepad.pose.position && this.gamepad.pose.orientation) {
      frame[path.matrix] = this.matrix
        .compose(
          this.position.fromArray(this.gamepad.pose.position),
          this.orientation.fromArray(this.gamepad.pose.orientation),
          ONES
        )
        .premultiply(this.sittingToStandingMatrix)
        .multiply(HAND_OFFSET);
    }
  }
}
