import { sets } from "../sets";
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

export class AppAwareMouseDevice {
  constructor() {
    this.prevButtonLeft = false;
    this.clickedOnAnything = false;
  }

  write(frame) {
    if (!this.cursorController) {
      this.cursorController = document.querySelector("[cursor-controller]").components["cursor-controller"];
    }

    if (!this.camera) {
      this.camera = document.querySelector("#player-camera").components.camera.camera;
    }

    const buttonLeft = frame[paths.device.mouse.buttonLeft];
    if (buttonLeft && !this.prevButtonLeft) {
      const rawIntersections = [];
      this.cursorController.raycaster.intersectObjects(this.cursorController.targets, true, rawIntersections);
      const intersection = rawIntersections.find(x => x.object.el);
      const userinput = AFRAME.scenes[0].systems.userinput;
      this.clickedOnAnything =
        (intersection &&
          intersection.object.el.matches(".pen, .pen *, .video, .video *, .interactable, .interactable *")) ||
        userinput.activeSets.has(sets.cursorHoldingPen) ||
        userinput.activeSets.has(sets.cursorHoldingInteractable) ||
        userinput.activeSets.has(sets.cursorHoldingCamera);
    }
    this.prevButtonLeft = buttonLeft;

    if (!buttonLeft) {
      this.clickedOnAnything = false;
    }

    if (!this.clickedOnAnything && buttonLeft) {
      frame[paths.device.smartMouse.cameraDelta] = frame[paths.device.mouse.movementXY];
    }

    const coords = frame[paths.device.mouse.coords];
    frame[paths.device.smartMouse.cursorPose] = calculateCursorPose(this.camera, coords);
  }
}
