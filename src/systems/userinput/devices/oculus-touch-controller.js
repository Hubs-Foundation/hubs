import { paths } from "../paths";
import { Pose } from "../pose";
import { copySittingToStandingTransform } from "./copy-sitting-to-standing-transform";

const ONES = new THREE.Vector3(1, 1, 1);

export const leftOculusTouchButtonMap = [
  { name: "thumbStick", buttonId: 0 },
  { name: "trigger", buttonId: 1 },
  { name: "grip", buttonId: 2 },
  { name: "x", buttonId: 3 },
  { name: "y", buttonId: 4 }
];
export const rightOculusTouchButtonMap = [
  { name: "thumbStick", buttonId: 0 },
  { name: "trigger", buttonId: 1 },
  { name: "grip", buttonId: 2 },
  { name: "a", buttonId: 3 },
  { name: "b", buttonId: 4 }
];

const LEFT_HAND_OFFSET = new THREE.Matrix4().makeTranslation(-0.025, -0.03, 0.1);
const RIGHT_HAND_OFFSET = new THREE.Matrix4().makeTranslation(0.025, -0.03, 0.1);

const m = new THREE.Matrix4();

export class OculusTouchControllerDevice {
  constructor(gamepad) {
    this.rayObjectRotation = new THREE.Quaternion();

    // wake the gamepad api up. otherwise it does not report touch controllers.
    // in chrome it still won't unless you enter vr.
    navigator.getVRDisplays();

    const buttonMaps = {
      left: leftOculusTouchButtonMap,
      right: rightOculusTouchButtonMap
    };

    const devicePaths = {
      left: paths.device.leftOculusTouch,
      right: paths.device.rightOculusTouch
    };

    this.gamepad = gamepad;
    this.pose = new Pose();
    this.buttonMap = buttonMaps[gamepad.hand];
    this.axisMap = [
      { name: "joyX", axisId: 0 },
      { name: "joyY", axisId: 1 }
    ];
    this.sittingToStandingMatrix = new THREE.Matrix4().makeTranslation(0, 1.6, 0);
    copySittingToStandingTransform(this.sittingToStandingMatrix);
    this.matrix = new THREE.Matrix4();
    this.path = devicePaths[gamepad.hand];
    this.selector = `#player-${gamepad.hand}-controller`;

    this.position = new THREE.Vector3();
    this.orientation = new THREE.Quaternion();
    this.handOffset = this.gamepad.hand === "left" ? LEFT_HAND_OFFSET : RIGHT_HAND_OFFSET;
  }

  write(frame) {
    if (!this.gamepad) return;
    this.gamepad = navigator.getGamepads()[this.gamepad.index];
    if (!this.gamepad || !this.gamepad.connected) return;

    this.buttonMap.forEach(b => {
      const path = this.path.button(b.name);
      const button = this.gamepad.buttons[b.buttonId];
      frame.setValueType(path.pressed, !!button.pressed);
      frame.setValueType(path.touched, !!button.touched);
      frame.setValueType(path.value, button.value);
    });
    frame.setValueType(this.path.axesSum, 0);
    this.axisMap.forEach(axis => {
      frame.setValueType(this.path.axis(axis.name), this.gamepad.axes[axis.axisId]);
      frame.setValueType(this.path.axesSum, frame.get(this.path.axesSum) + Math.abs(this.gamepad.axes[axis.axisId]));
    });

    this.rayObject = this.rayObject || document.querySelector(this.selector).object3D;
    this.rayObject.updateMatrixWorld();
    this.rayObjectRotation.setFromRotationMatrix(m.extractRotation(this.rayObject.matrixWorld));
    this.pose.position.setFromMatrixPosition(this.rayObject.matrixWorld);
    this.pose.direction.set(0, 0, -1).applyQuaternion(this.rayObjectRotation);
    this.pose.orientation.copy(this.rayObjectRotation);

    frame.setPose(this.path.pose, this.pose);
    if (this.gamepad.pose.position && this.gamepad.pose.orientation) {
      frame.setMatrix4(
        this.path.matrix,
        this.matrix
          .compose(
            this.position.fromArray(this.gamepad.pose.position),
            this.orientation.fromArray(this.gamepad.pose.orientation),
            ONES
          )
          .premultiply(this.sittingToStandingMatrix)
          .multiply(this.handOffset)
      );
    }
    if (this.gamepad.hapticActuators && this.gamepad.hapticActuators[0]) {
      frame.setValueType(paths.haptics.actuators[this.gamepad.hand], this.gamepad.hapticActuators[0]);
    }
  }
}
