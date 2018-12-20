import { paths } from "../paths";
import { Pose } from "../pose";

export class WindowsMixedRealityControllerDevice {
  constructor(gamepad) {
    this.rayObject = null;
    this.rayObjectRotation = new THREE.Quaternion();

    // wake the gamepad api up. otherwise it does not report touch controllers.
    // in chrome it still won't unless you enter vr.
    navigator.getVRDisplays();

    this.buttonMap = [
      { name: "touchpad", buttonId: 0 },
      { name: "trigger", buttonId: 1 },
      { name: "grip", buttonId: 2 },
      { name: "menu", buttonId: 3 }
    ];

    this.gamepad = gamepad;
    this.pose = new Pose();
    this.axisMap = [
      { name: "padX", axisId: 0 },
      { name: "padY", axisId: 1 },
      { name: "joyX", axisId: 2 },
      { name: "joyY", axisId: 3 }
    ];
    const hand = gamepad.index === 0 ? "left" : "right";
    this.path = paths.device.wmr[hand];
    this.selector = `#player-${hand}-controller`;
  }
  write(frame) {
    if (!this.gamepad.connected) return;

    for (const button of this.buttonMap) {
      const outpath = this.path.button(button.name);
      const gamepadButton = this.gamepad.buttons[button.buttonId];
      frame[outpath.pressed] = !!gamepadButton.pressed;
      frame[outpath.touched] = !!gamepadButton.touched;
      frame[outpath.value] = gamepadButton.value;
    }
    for (const axis of this.axisMap) {
      frame[this.path.axis(axis.name)] = this.gamepad.axes[axis.axisId];
    }

    this.rayObject = this.rayObject || document.querySelector(this.selector).object3D;
    this.rayObject.updateMatrixWorld();
    this.rayObjectRotation.setFromRotationMatrix(this.rayObject.matrixWorld);

    this.pose.position.setFromMatrixPosition(this.rayObject.matrixWorld);
    this.pose.direction.set(0, 0, -1).applyQuaternion(this.rayObjectRotation);
    this.pose.fromOriginAndDirection(this.pose.position, this.pose.direction);
    frame[this.path.pose] = this.pose;
  }
}
