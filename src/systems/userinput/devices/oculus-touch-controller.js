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
    this.axisMap = [{ name: "joyX", axisId: 0 }, { name: "joyY", axisId: 1 }];
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
    if (!this.gamepad.connected) return;

    for (let i = 0; i < this.gamepad.buttons.length; i++) {
      const buttonPath = paths.device.gamepad(this.gamepad.index).button(i);
      const button = this.gamepad.buttons[i];
      frame[buttonPath.pressed] = !!button.pressed;
      frame[buttonPath.touched] = !!button.touched;
      frame[buttonPath.value] = button.value;
    }
    for (let i = 0; i < this.gamepad.axes.length; i++) {
      const axis = this.gamepad.axes[i];
      frame[paths.device.gamepad(this.gamepad.index).axis(i)] = axis;
    }

    this.buttonMap.forEach(button => {
      const outpath = this.path.button(button.name);
      frame[outpath.pressed] = !!frame[paths.device.gamepad(this.gamepad.index).button(button.buttonId).pressed];
      frame[outpath.touched] = !!frame[paths.device.gamepad(this.gamepad.index).button(button.buttonId).touched];
      frame[outpath.value] = frame[paths.device.gamepad(this.gamepad.index).button(button.buttonId).value];
    });
    this.axisMap.forEach(axis => {
      frame[this.path.axis(axis.name)] = frame[paths.device.gamepad(this.gamepad.index).axis(axis.axisId)];
    });

    this.rayObject = this.rayObject || document.querySelector(this.selector).object3D;
    this.rayObject.updateMatrixWorld();
    this.rayObjectRotation.setFromRotationMatrix(this.rayObject.matrixWorld);
    this.pose.position.setFromMatrixPosition(this.rayObject.matrixWorld);
    this.pose.direction.set(0, 0, -1).applyQuaternion(this.rayObjectRotation);
    this.pose.fromOriginAndDirection(this.pose.position, this.pose.direction);
    frame[this.path.pose] = this.pose;
    if (this.gamepad.pose.position && this.gamepad.pose.orientation) {
      frame[this.path.matrix] = this.matrix
        .compose(
          this.position.fromArray(this.gamepad.pose.position),
          this.orientation.fromArray(this.gamepad.pose.orientation),
          ONES
        )
        .premultiply(this.sittingToStandingMatrix)
        .multiply(this.handOffset);
    }
  }
}
