import { sets } from "../sets";
import { paths } from "../paths";
import { Pose } from "../pose";
import { findRemoteHoverTarget } from "../../interactions";
import { canMove } from "../../../utils/permissions-utils";

const calculateCursorPose = function(camera, coords, origin, direction, cursorPose) {
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
    this.cursorPose = new Pose();
    this.prevCursorPose = new Pose();
    this.origin = new THREE.Vector3();
    this.prevOrigin = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.prevDirection = new THREE.Vector3();
  }

  write(frame) {
    this.prevCursorPose.copy(this.cursorPose);
    this.prevOrigin.copy(this.origin);
    this.prevDirection.copy(this.prevDirection);

    if (!this.cursorController) {
      this.cursorController = document.getElementById("right-cursor-controller").components["cursor-controller"];
    }

    if (!this.camera) {
      this.camera = document.getElementById("viewing-camera").components.camera.camera;
    }

    const buttonLeft = frame.get(paths.device.mouse.buttonLeft);
    const buttonRight = frame.get(paths.device.mouse.buttonRight);
    if (buttonLeft && !this.prevButtonLeft) {
      const rawIntersections = [];
      this.cursorController.raycaster.intersectObjects(
        AFRAME.scenes[0].systems["hubs-systems"].cursorTargettingSystem.targets,
        true,
        rawIntersections
      );
      const intersection = rawIntersections.find(x => x.object.el);
      const remoteHoverTarget = intersection && findRemoteHoverTarget(intersection.object);
      const userinput = AFRAME.scenes[0].systems.userinput;
      const isInteractable = intersection && intersection.object.el.matches(".interactable, .interactable *");
      const isPinned =
        remoteHoverTarget && remoteHoverTarget.components.pinnable && remoteHoverTarget.components.pinnable.data.pinned;
      const isFrozen = AFRAME.scenes[0].is("frozen");
      this.clickedOnAnything =
        (isInteractable && (isFrozen || !isPinned) && (remoteHoverTarget && canMove(remoteHoverTarget))) ||
        userinput.activeSets.includes(sets.rightCursorHoldingPen) ||
        userinput.activeSets.includes(sets.rightCursorHoldingInteractable) ||
        userinput.activeSets.includes(sets.rightCursorHoldingCamera);
    }
    this.prevButtonLeft = buttonLeft;

    if (!buttonLeft) {
      this.clickedOnAnything = false;
    }

    if ((!this.clickedOnAnything && buttonLeft) || buttonRight) {
      const movementXY = frame.get(paths.device.mouse.movementXY);
      if (movementXY) {
        frame.setVector2(paths.device.smartMouse.cameraDelta, movementXY[0], movementXY[1]);
      }
      frame.setValueType(paths.device.smartMouse.shouldMoveCamera, true);
    }

    const coords = frame.get(paths.device.mouse.coords);
    frame.setPose(
      paths.device.smartMouse.cursorPose,
      calculateCursorPose(this.camera, coords, this.origin, this.direction, this.cursorPose)
    );
  }
}
