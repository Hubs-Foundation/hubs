import { paths } from "../paths";
import { Pose } from "../pose";
import { copySittingToStandingTransform } from "./copy-sitting-to-standing-transform";

const ONES = new THREE.Vector3(1, 1, 1);
const HAND_OFFSET = new THREE.Matrix4().compose(
  new THREE.Vector3(0, 0, 0.13),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(-40 * THREE.Math.DEG2RAD, 0, 0)),
  new THREE.Vector3(1, 1, 1)
);
const RAY_ROTATION = new THREE.Quaternion();
const m = new THREE.Matrix4();

export class ViveControllerDevice {
  constructor(gamepad) {
    // wake the gamepad api up. otherwise it does not report touch controllers.
    // in chrome it still won't unless you enter vr.
    navigator.getVRDisplays();
    this.gamepad = gamepad;

    if (this.gamepad.id === "OpenVR Cosmos") {
      RAY_ROTATION.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 12);
      this.buttonMap = [
        { name: "trigger", buttonId: 0 },
        { name: "grip", buttonId: 1 },
        { name: "primary", buttonId: 2 },
        { name: "secondary", buttonId: 3 },
        { name: "joystick", buttonId: 4 },
        { name: "bumper", buttonId: 5 }
      ];
      this.axisMap = [{ name: "joyX", axisId: 0 }, { name: "joyY", axisId: 1 }];
    } else if (this.gamepad.id === "HTC Vive Focus Plus Controller") {
      RAY_ROTATION.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 15);
      this.buttonMap = [
        { name: "touchpad", buttonId: 0 },
        { name: "trigger", buttonId: 1 },
        { name: "grip", buttonId: 2 }
      ];
      this.axisMap = [{ name: "touchX", axisId: 0 }, { name: "touchY", axisId: 1 }];
    } else if (this.gamepad.axes.length === 4) {
      RAY_ROTATION.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 12);
      this.buttonMap = [
        { name: "touchpad", buttonId: 0 },
        { name: "trigger", buttonId: 1 },
        { name: "grip", buttonId: 2 },
        { name: "primary", buttonId: 3 },
        { name: "secondary", buttonId: 4 },
        { name: "joystick", buttonId: 5 },
        { name: "index", buttonId: 6 },
        { name: "middle", buttonId: 7 },
        { name: "ring", buttonId: 8 },
        { name: "pinky", buttonId: 9 }
      ];
      this.axisMap = [
        { name: "touchX", axisId: 0 },
        { name: "touchY", axisId: 1 },
        { name: "joyX", axisId: 2 },
        { name: "joyY", axisId: 3 }
      ];
    } else {
      RAY_ROTATION.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 12);
      this.buttonMap = [
        { name: "touchpad", buttonId: 0 },
        { name: "trigger", buttonId: 1 },
        { name: "grip", buttonId: 2 },
        { name: "primary", buttonId: 3 }
      ];
      this.axisMap = [{ name: "touchX", axisId: 0 }, { name: "touchY", axisId: 1 }];
    }

    this.pose = new Pose();
    this.rayObjectRotation = new THREE.Quaternion();
    this.path = paths.device.vive[gamepad.hand || "right"];
    this.sittingToStandingMatrix = new THREE.Matrix4().makeTranslation(0, 1.6, 0);
    copySittingToStandingTransform(this.sittingToStandingMatrix);

    this.matrix = new THREE.Matrix4();
    this.position = new THREE.Vector3();
    this.orientation = new THREE.Quaternion();
  }

  write(frame) {
    const gamepads = navigator.getGamepads();
    if (gamepads.length < this.gamepad.index + 1) {
      //workaround for: https://bugzilla.mozilla.org/show_bug.cgi?id=1568076
      return;
    }
    this.gamepad = gamepads[this.gamepad.index];
    if (!this.gamepad.connected) return;

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

    if (!this.selector) {
      if (this.gamepad.hand) {
        this.path = paths.device.vive[this.gamepad.hand];
        this.selector = `#player-${this.gamepad.hand}-controller`;
        console.warn("gamepad hand eventually specified");
      } else {
        return;
      }
    }
    const el = document.querySelector(this.selector);
    const rayObject = el.object3D;
    rayObject.updateMatrixWorld();
    this.rayObjectRotation.setFromRotationMatrix(m.extractRotation(rayObject.matrixWorld));
    this.pose.position.setFromMatrixPosition(rayObject.matrixWorld);
    this.pose.direction
      .set(0, 0, -1)
      .applyQuaternion(RAY_ROTATION)
      .applyQuaternion(this.rayObjectRotation);
    this.pose.fromOriginAndDirection(this.pose.position, this.pose.direction);
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
          .multiply(HAND_OFFSET)
      );
    }

    if (this.gamepad.hapticActuators && this.gamepad.hapticActuators[0]) {
      frame.setValueType(paths.haptics.actuators[this.gamepad.hand], this.gamepad.hapticActuators[0]);
    }
  }
}
