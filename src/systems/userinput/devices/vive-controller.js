import { paths } from "../paths";
import { Pose } from "../pose";

export class ViveControllerDevice {
  constructor(gamepad) {
    this.rayObjectRotation = new THREE.Quaternion();

    // wake the gamepad api up. otherwise it does not report touch controllers.
    // in chrome it still won't unless you enter vr.
    navigator.getVRDisplays();

    this.buttonMap = [
      { name: "touchpad", buttonId: 0 },
      { name: "trigger", buttonId: 1 },
      { name: "grip", buttonId: 2 },
      { name: "top", buttonId: 3 }
    ];

    this.gamepad = gamepad;
    this.pose = new Pose();
    this.axisMap = [{ name: "joyX", axisId: 0 }, { name: "joyY", axisId: 1 }];
    this.path = paths.device.vive[gamepad.hand || "right"];
    if (!gamepad.hand) {
      console.warn("gamepad detected without hand specified");
    } else {
      this.selector = `[super-hands]#player-${gamepad.hand}-controller`;
    }
  }
  write(frame) {
    if (!this.gamepad.connected) return;

    this.gamepad.buttons.forEach((button, i) => {
      const buttonPath = paths.device.gamepad(this.gamepad.index).button(i);
      frame[buttonPath.pressed] = !!button.pressed;
      frame[buttonPath.touched] = !!button.touched;
      frame[buttonPath.value] = button.value;
    });
    this.gamepad.axes.forEach((axis, i) => {
      frame[paths.device.gamepad(this.gamepad.index).axis(i)] = axis;
    });

    this.buttonMap.forEach(button => {
      const outpath = this.path.button(button.name);
      frame[outpath.pressed] = !!frame[paths.device.gamepad(this.gamepad.index).button(button.buttonId).pressed];
      frame[outpath.touched] = !!frame[paths.device.gamepad(this.gamepad.index).button(button.buttonId).touched];
      frame[outpath.value] = frame[paths.device.gamepad(this.gamepad.index).button(button.buttonId).value];
    });
    this.axisMap.forEach(axis => {
      frame[this.path.axis(axis.name)] = frame[paths.device.gamepad(this.gamepad.index).axis(axis.axisId)];
    });

    if (!this.selector) {
      if (this.gamepad.hand) {
        this.path = paths.device.vive[this.gamepad.hand];
        this.selector = `[super-hands]#player-${this.gamepad.hand}-controller`;
        console.warn("gamepad hand eventually specified");
      } else {
        return;
      }
    }
    const el = document.querySelector(this.selector);
    if (el.components["tracked-controls"].controller !== this.gamepad) {
      el.components["tracked-controls"].controller = this.gamepad;
      el.setAttribute("tracked-controls", "controller", this.gamepad.index);
    }
    const rayObject = el.object3D;
    rayObject.updateMatrixWorld();
    this.rayObjectRotation.setFromRotationMatrix(rayObject.matrixWorld);
    this.pose.position.setFromMatrixPosition(rayObject.matrixWorld);
    this.pose.direction.set(0, 0, -1).applyQuaternion(this.rayObjectRotation);
    this.pose.fromOriginAndDirection(this.pose.position, this.pose.direction);
    frame[this.path.pose] = this.pose;
  }
}
