import { paths } from "../paths";
import { Pose } from "../pose";

const calculateCursorPose = function(camera, coords) {
  const cursorPose = new Pose();
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  origin.setFromMatrixPosition(camera.matrixWorld);
  direction
    .set(coords[0], coords[1], 0.5)
    .unproject(camera)
    .sub(origin)
    .normalize();
  cursorPose.fromOriginAndDirection(origin, direction);
  return cursorPose;
};

export class SmartMouseDevice {
  constructor() {
    this.prevButtonLeft = false;
    this.clickedOnAnything = false;
  }

  write(frame) {
    const cursorController = document.querySelector("[cursor-controller]").components["cursor-controller"];
    if (!cursorController) {
      console.error("initialization order error? get aframe'd");
      return;
    }

    const coords = frame[paths.device.mouse.coords];
    const isCursorGrabbing = cursorController.data.cursor.components["super-hands"].state.has("grab-start");
    if (isCursorGrabbing) {
      const camera = document.querySelector("#player-camera").components.camera.camera;
      frame[paths.device.smartMouse.cursorPose] = calculateCursorPose(camera, coords);
      return;
    }

    const buttonLeft = frame[paths.device.mouse.buttonLeft];
    if (buttonLeft && !this.prevButtonLeft) {
      const rawIntersections = [];
      cursorController.raycaster.intersectObjects(cursorController.targets, true, rawIntersections);
      const intersection = rawIntersections.find(x => x.object.el);
      this.clickedOnAnything =
        intersection &&
        intersection.object.el.matches(".pen, .pen *, .video, .video *, .interactable, .interactable *");
    }
    this.prevButtonLeft = buttonLeft;

    if (!buttonLeft) {
      this.clickedOnAnything = false;
    }

    if (!this.clickedOnAnything && buttonLeft) {
      frame[paths.device.smartMouse.cameraDelta] = frame[paths.device.mouse.movementXY];
    } else {
      const camera = document.querySelector("#player-camera").components.camera.camera;
      frame[paths.device.smartMouse.cursorPose] = calculateCursorPose(camera, coords);
    }
  }
}
