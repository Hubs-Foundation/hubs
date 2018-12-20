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

    // TODO BP: Why are we doing this intermediate index path copy, instead of copying directly to the named path?
    for (let i = 0; i < this.gamepad.buttons.length; i++) {
      const buttonPath = paths.device.gamepad(this.gamepad.index).button(i);
      const button = this.gamepad.buttons[i];
      frame[buttonPath.pressed] = !!button.pressed;
      frame[buttonPath.touched] = !!button.touched;
      frame[buttonPath.value] = button.value;
    }
    for (let i = 0; i < this.gamepad.axes.length; i++) {
      frame[paths.device.gamepad(this.gamepad.index).axis(i)] = this.gamepad.axes[i];
    }

    for (const button of this.buttonMap) {
      const outpath = this.path.button(button.name);
      const gamepadButton = paths.device.gamepad(this.gamepad.index).button(button.buttonId);
      frame[outpath.pressed] = !!frame[gamepadButton.pressed];
      frame[outpath.touched] = !!frame[gamepadButton.touched];
      frame[outpath.value] = frame[gamepadButton.value];
    }
    for (const axis of this.axisMap) {
      frame[this.path.axis(axis.name)] = frame[paths.device.gamepad(this.gamepad.index).axis(axis.axisId)];
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
