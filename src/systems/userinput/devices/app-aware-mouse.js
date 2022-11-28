import { HeldRemoteRight } from "../../../bit-components";
import { anyEntityWith } from "../../../utils/bit-utils";
import { paths } from "../paths";
import { Pose } from "../pose";

const calculateCursorPose = (function () {
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  return function (cursorPose, camera, coords) {
    origin.setFromMatrixPosition(camera.matrixWorld);
    direction.set(coords[0], coords[1], 0.5).unproject(camera).sub(origin).normalize();
    cursorPose.fromOriginAndDirection(origin, direction);
    return cursorPose;
  };
})();

export class AppAwareMouseDevice {
  constructor() {
    this.cursorPose = new Pose();
  }
  write(frame) {
    const transformSystem = AFRAME.scenes[0].systems["transform-selected-object"];

    const buttonLeft = frame.get(paths.device.mouse.buttonLeft);
    const buttonRight = frame.get(paths.device.mouse.buttonRight);

    if ((buttonRight && !transformSystem.transforming) || (buttonLeft && !anyEntityWith(APP.world, HeldRemoteRight))) {
      const movementXY = frame.get(paths.device.mouse.movementXY);
      if (movementXY) {
        frame.setVector2(paths.device.smartMouse.cameraDelta, movementXY[0], movementXY[1]);
      }
      frame.setValueType(paths.device.smartMouse.shouldMoveCamera, true);
    }

    if (!this.camera) {
      this.camera = AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.viewingCamera;
    }

    if (this.camera) {
      frame.setPose(
        paths.device.smartMouse.cursorPose,
        calculateCursorPose(this.cursorPose, this.camera, frame.get(paths.device.mouse.coords))
      );
    }
  }
}
