import { paths } from "../paths";
import { Pose } from "../pose";

const ONES = new THREE.Vector3(1, 1, 1);
// Note these offests are specifically for the oculus touch controllers on a Quest.
// We'll have to account for other headsets and controllers as we expand WebXR support.
const LEFT_HAND_OFFSET = new THREE.Matrix4().makeTranslation(-0.025, -0.03, 0.12);
const RIGHT_HAND_OFFSET = new THREE.Matrix4().makeTranslation(0.025, -0.03, 0.12);
const m = new THREE.Matrix4();

export class WebXRControllerDevice {
  constructor(gamepad) {
    this.gamepad = gamepad;

    this.selector = `#player-${gamepad.hand}-controller`;
    this.rayObject = null;
    this.rayObjectRotation = new THREE.Quaternion();
    this.pose = new Pose();

    this.matrix = new THREE.Matrix4();
    this.position = new THREE.Vector3();
    this.orientation = new THREE.Quaternion();
  }
  write(frame, scene, referenceSpace) {
    if (!referenceSpace || !this.gamepad || !this.gamepad.connected) return;

    const hand = this.gamepad.hand || "right";
    const path = paths.device.webxr[hand];

    if (this.gamepad.buttons[0]) {
      frame.setValueType(path.button.trigger.pressed, this.gamepad.buttons[0].pressed);
      frame.setValueType(path.button.trigger.touched, this.gamepad.buttons[0].touched);
      frame.setValueType(path.button.trigger.value, this.gamepad.buttons[0].value);
    }

    if (this.gamepad.buttons[1]) {
      frame.setValueType(path.button.grip.pressed, this.gamepad.buttons[1].pressed);
      frame.setValueType(path.button.grip.touched, this.gamepad.buttons[1].touched);
      frame.setValueType(path.button.grip.value, this.gamepad.buttons[1].value);
    }

    if (this.gamepad.buttons[2]) {
      frame.setValueType(path.button.touchpad.pressed, this.gamepad.buttons[2].pressed);
      frame.setValueType(path.button.touchpad.touched, this.gamepad.buttons[2].touched);
      frame.setValueType(path.button.touchpad.value, this.gamepad.buttons[2].value);
    }

    if (this.gamepad.buttons[3]) {
      frame.setValueType(path.button.thumbStick.pressed, this.gamepad.buttons[3].pressed);
      frame.setValueType(path.button.thumbStick.touched, this.gamepad.buttons[3].touched);
      frame.setValueType(path.button.thumbStick.value, this.gamepad.buttons[3].value);
    }

    if (this.gamepad.buttons[4]) {
      frame.setValueType(path.button.a.pressed, this.gamepad.buttons[4].pressed);
      frame.setValueType(path.button.a.touched, this.gamepad.buttons[4].touched);
      frame.setValueType(path.button.a.value, this.gamepad.buttons[4].value);
    }

    if (this.gamepad.buttons[5]) {
      frame.setValueType(path.button.b.pressed, this.gamepad.buttons[5].pressed);
      frame.setValueType(path.button.b.touched, this.gamepad.buttons[5].touched);
      frame.setValueType(path.button.b.value, this.gamepad.buttons[5].value);
    }

    if (this.gamepad.axes.length >= 4) {
      frame.setValueType(path.axis.touchpadX, this.gamepad.axes[0]);
      frame.setValueType(path.axis.touchpadY, this.gamepad.axes[1]);
      frame.setValueType(path.axis.joyX, this.gamepad.axes[2]);
      frame.setValueType(path.axis.joyY, this.gamepad.axes[3]);
    }
    this.rayObject = this.rayObject || document.querySelector(this.selector).object3D;
    this.rayObject.updateMatrixWorld();
    this.rayObjectRotation.setFromRotationMatrix(m.extractRotation(this.rayObject.matrixWorld));

    this.pose.position.setFromMatrixPosition(this.rayObject.matrixWorld);
    this.pose.direction.set(0, 0, -1).applyQuaternion(this.rayObjectRotation);
    this.pose.orientation.copy(this.rayObjectRotation);

    frame.setPose(path.pose, this.pose);

    const pose = scene.frame.getPose(this.gamepad.targetRaySpace, referenceSpace);

    if (pose && pose.transform.position && pose.transform.orientation) {
      this.position.copy(pose.transform.position);
      this.orientation.copy(pose.transform.orientation);
      this.matrix.compose(
        this.position,
        this.orientation,
        ONES
      );
      this.matrix.multiply(hand === "left" ? LEFT_HAND_OFFSET : RIGHT_HAND_OFFSET);
      frame.setMatrix4(path.matrix, this.matrix);
    }
  }
}
