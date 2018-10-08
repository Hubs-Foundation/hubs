import { paths } from "../paths";
import { Pose } from "../pose";
import { touchIsAssigned, jobIsAssigned, assign, unassign, findByJob, findByTouch } from "./touchscreen/assignments";

const MOVE_CURSOR_JOB = "MOVE CURSOR";
const MOVE_CAMERA_JOB = "MOVE CAMERA";
const FIRST_PINCHER_JOB = "FIRST PINCHER";
const SECOND_PINCHER_JOB = "SECOND PINCHER";

function distance(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

function shouldMoveCursor(touch, raycaster) {
  const cursorController = document.querySelector("[cursor-controller]").components["cursor-controller"];
  const isCursorGrabbing = cursorController.data.cursor.components["super-hands"].state.has("grab-start");
  if (isCursorGrabbing) {
    return true;
  }
  const rawIntersections = [];
  raycaster.setFromCamera(
    {
      x: (touch.clientX / window.innerWidth) * 2 - 1,
      y: -(touch.clientY / window.innerHeight) * 2 + 1
    },
    document.querySelector("#player-camera").components.camera.camera
  );
  raycaster.intersectObjects(cursorController.targets, true, rawIntersections);
  const intersection = rawIntersections.find(x => x.object.el);
  return intersection && intersection.object.el.matches(".interactable, .interactable *");
}

export class AppAwareTouchscreenDevice {
  constructor() {
    this.raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 3);
    this.assignments = [];
    this.pinch = {};
    this.events = [];
    ["touchstart", "touchend", "touchmove", "touchcancel"].map(x =>
      document.querySelector("canvas").addEventListener(x, this.events.push.bind(this.events))
    );
  }

  end(touch) {
    if (!touchIsAssigned(touch, this.assignments)) {
      console.warn("touch does not have a job", touch);
      return;
    }

    const assignment = findByTouch(touch, this.assignments);
    switch (assignment.job) {
      case MOVE_CURSOR_JOB:
      case MOVE_CAMERA_JOB:
        unassign(assignment.touch, assignment.job, this.assignments);
        break;
      case FIRST_PINCHER_JOB:
        unassign(assignment.touch, assignment.job, this.assignments);
        this.pinch = undefined;

        if (jobIsAssigned(SECOND_PINCHER_JOB, this.assignments)) {
          const second = findByJob(SECOND_PINCHER_JOB, this.assignments);
          unassign(second.touch, second.job, this.assignments);
          if (jobIsAssigned(MOVE_CAMERA_JOB, this.assignments)) {
            // reassign secondPincher to firstPincher
            const first = assign(second.touch, FIRST_PINCHER_JOB, this.assignments);
            first.clientX = second.clientX;
            first.clientY = second.clientY;
          } else {
            // reassign secondPincher to moveCamera
            const cameraMover = assign(second.touch, MOVE_CAMERA_JOB, this.assignments);
            cameraMover.clientX = second.clientX;
            cameraMover.clientY = second.clientY;
            cameraMover.delta = [0, 0];
          }
        }
        break;
      case SECOND_PINCHER_JOB:
        unassign(assignment.touch, assignment.job, this.assignments);
        this.pinch = undefined;
        if (jobIsAssigned(FIRST_PINCHER_JOB, this.assignments) && !jobIsAssigned(MOVE_CAMERA_JOB, this.assignments)) {
          //reassign firstPincher to moveCamera
          const first = findByJob(FIRST_PINCHER_JOB, this.assignments);
          unassign(first.touch, first.job, this.assignments);
          const cameraMover = assign(first.touch, MOVE_CAMERA_JOB, this.assignments);
          cameraMover.clientX = first.clientX;
          cameraMover.clientY = first.clientY;
          cameraMover.delta = [0, 0];
        }
        break;
    }
  }

  move(touch) {
    if (!touchIsAssigned(touch, this.assignments)) {
      console.warn("touch does not have job", touch);
      return;
    }

    const assignment = findByTouch(touch, this.assignments);
    switch (assignment.job) {
      case MOVE_CURSOR_JOB:
        assignment.cursorPose.fromCameraProjection(
          document.querySelector("#player-camera").components.camera.camera,
          (touch.clientX / window.innerWidth) * 2 - 1,
          -(touch.clientY / window.innerHeight) * 2 + 1
        );
        break;
      case MOVE_CAMERA_JOB:
        assignment.delta[0] += touch.clientX - assignment.clientX;
        assignment.delta[1] += touch.clientY - assignment.clientY;
        assignment.clientX = touch.clientX;
        assignment.clientY = touch.clientY;
        break;
      case FIRST_PINCHER_JOB:
      case SECOND_PINCHER_JOB:
        assignment.clientX = touch.clientX;
        assignment.clientY = touch.clientY;
        if (jobIsAssigned(FIRST_PINCHER_JOB, this.assignments) && jobIsAssigned(SECOND_PINCHER_JOB, this.assignments)) {
          const first = findByJob(FIRST_PINCHER_JOB, this.assignments);
          const second = findByJob(SECOND_PINCHER_JOB, this.assignments);
          const currentDistance = distance(first.clientX, first.clientY, second.clientX, second.clientY);
          this.pinch.delta += currentDistance - this.pinch.currentDistance;
          this.pinch.currentDistance = currentDistance;
        }
        break;
    }
  }

  start(touch) {
    if (touchIsAssigned(touch, this.assignments)) {
      console.error("touch already has a job");
      return;
    }

    if (!jobIsAssigned(MOVE_CURSOR_JOB, this.assignments) && shouldMoveCursor(touch, this.raycaster)) {
      const assignment = assign(touch, MOVE_CURSOR_JOB, this.assignments);
      assignment.cursorPose = new Pose().fromCameraProjection(
        document.querySelector("#player-camera").components.camera.camera,
        (touch.clientX / window.innerWidth) * 2 - 1,
        -(touch.clientY / window.innerHeight) * 2 + 1
      );
      assignment.isFirstFrame = true;
      return;
    }

    if (!jobIsAssigned(MOVE_CAMERA_JOB, this.assignments)) {
      const assignment = assign(touch, MOVE_CAMERA_JOB, this.assignments);
      assignment.clientX = touch.clientX;
      assignment.clientY = touch.clientY;
      assignment.delta = [0, 0];
      return;
    }

    if (!jobIsAssigned(SECOND_PINCHER_JOB, this.assignments)) {
      let first;
      if (jobIsAssigned(FIRST_PINCHER_JOB, this.assignments)) {
        first = findByJob(FIRST_PINCHER_JOB, this.assignments);
      } else {
        const cameraMover = findByJob(MOVE_CAMERA_JOB, this.assignments);
        unassign(cameraMover.touch, cameraMover.job, this.assignments);

        first = assign(cameraMover.touch, FIRST_PINCHER_JOB, this.assignments);
        first.clientX = cameraMover.clientX;
        first.clientY = cameraMover.clientY;
      }

      const second = assign(touch, SECOND_PINCHER_JOB, this.assignments);
      second.clientX = touch.clientX;
      second.clientY = touch.clientY;

      const initialDistance = distance(first.clientX, first.clientY, second.clientX, second.clientY);
      this.pinch = {
        initialDistance,
        currentDistance: initialDistance,
        delta: 0
      };
      return;
    }

    console.warn("no job suitable for touch", touch);
  }

  process(event) {
    switch (event.type) {
      case "touchstart":
        for (const touch of event.changedTouches) {
          this.start(touch);
        }
        break;
      case "touchmove":
        for (const touch of event.touches) {
          this.move(touch);
        }
        break;
      case "touchend":
      case "touchcancel":
        for (const touch of event.changedTouches) {
          this.end(touch);
        }
        break;
    }
  }

  write(frame) {
    if (this.pinch) {
      this.pinch.delta = 0;
    }
    let cameraMover = jobIsAssigned(MOVE_CAMERA_JOB, this.assignments) && findByJob(MOVE_CAMERA_JOB, this.assignments);
    if (cameraMover) {
      cameraMover.delta[0] = 0;
      cameraMover.delta[1] = 0;
    }

    this.events.forEach(event => {
      this.process(event, frame);
    });
    while (this.events.length) {
      this.events.pop();
    }

    const path = paths.device.touchscreen;
    if (jobIsAssigned(MOVE_CURSOR_JOB, this.assignments)) {
      const assignment = findByJob(MOVE_CURSOR_JOB, this.assignments);
      frame[path.cursorPose] = assignment.cursorPose;
      // If you touch a grabbable, we want to wait 1 frame before admitting it to anyone else, because we
      // want to hover on the first frame and grab on the next.
      frame[path.isTouchingGrabbable] = !assignment.isFirstFrame;
      assignment.isFirstFrame = false;
    }

    if (jobIsAssigned(MOVE_CAMERA_JOB, this.assignments)) {
      frame[path.cameraDelta] = findByJob(MOVE_CAMERA_JOB, this.assignments).delta;
    }

    if (this.pinch) {
      frame[path.pinchDelta] = this.pinch.delta;
      frame[path.initialPinchDistance] = this.pinch.initialDistance;
      frame[path.currentPinchDistance] = this.pinch.currentDistance;
    }
  }
}
