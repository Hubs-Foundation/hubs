import { paths } from "./paths";
import { Pose } from "./pose";

const job = {};
job.moveCursor = "moveCursor";
job.moveCamera = "moveCamera";
job.firstPincher = "firstPincher";
job.secondPincher = "secondPincher";

function distance(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

function touchIsAssigned(touch, assignments) {
  return (
    assignments.find(assignment => {
      return assignment.touch.identifier === touch.identifier;
    }) !== undefined
  );
}

function jobIsAssigned(job, assignments) {
  return (
    assignments.find(assignment => {
      return assignment.job === job;
    }) !== undefined
  );
}

function assign(touch, job, assignments) {
  if (touchIsAssigned(touch, assignments) || jobIsAssigned(job, assignments)) {
    console.error("cannot reassign touches or jobs. unassign first");
    return undefined;
  }
  const assignment = { job, touch };
  assignments.push(assignment);
  return assignment;
}

function unassign(touch, job, assignments) {
  function match(assignment) {
    return assignment.touch.identifier === touch.identifier && assignment.job === job;
  }
  assignments.splice(assignments.findIndex(match), 1);
}

function findByJob(job, assignments) {
  return assignments.find(assignment => {
    return assignment.job === job;
  });
}

function findByTouch(touch, assignments) {
  return assignments.find(assignment => {
    return assignment.touch.identifier === touch.identifier;
  });
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
  const cursorShouldGrab = intersection && intersection.object.el.matches(".interactable, .interactable *");
  return cursorShouldGrab;
}

export default class Touchscreen {
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
      case job.moveCursor:
      case job.moveCamera:
        unassign(assignment.touch, assignment.job, this.assignments);
        break;
      case job.firstPincher:
        unassign(assignment.touch, assignment.job, this.assignments);
        this.pinch = undefined;

        if (jobIsAssigned(job.secondPincher, this.assignments)) {
          const second = findByJob(job.secondPincher, this.assignments);
          unassign(second.touch, second.job, this.assignments);
          if (jobIsAssigned(job.moveCamera, this.assignments)) {
            // reassign secondPincher to firstPincher
            const first = assign(second.touch, job.firstPincher, this.assignments);
            first.clientX = second.clientX;
            first.clientY = second.clientY;
          } else {
            // reassign secondPincher to moveCamera
            const cameraMover = assign(second.touch, job.moveCamera, this.assignments);
            cameraMover.clientX = second.clientX;
            cameraMover.clientY = second.clientY;
            cameraMover.delta = [0, 0];
          }
        }
        break;
      case job.secondPincher:
        unassign(assignment.touch, assignment.job, this.assignments);
        this.pinch = undefined;
        if (jobIsAssigned(job.firstPincher, this.assignments) && !jobIsAssigned(job.moveCamera, this.assignments)) {
          //reassign firstPincher to moveCamera
          const first = findByJob(job.firstPincher, this.assignments);
          unassign(first.touch, first.job, this.assignments);
          const cameraMover = assign(first.touch, job.moveCamera, this.assignments);
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
      case job.moveCursor:
        assignment.cursorPose.fromCameraProjection(
          document.querySelector("#player-camera").components.camera.camera,
          (touch.clientX / window.innerWidth) * 2 - 1,
          -(touch.clientY / window.innerHeight) * 2 + 1
        );
        break;
      case job.moveCamera:
        assignment.delta[0] += touch.clientX - assignment.clientX;
        assignment.delta[1] += touch.clientY - assignment.clientY;
        assignment.clientX = touch.clientX;
        assignment.clientY = touch.clientY;
        break;
      case job.firstPincher:
      case job.secondPincher:
        assignment.clientX = touch.clientX;
        assignment.clientY = touch.clientY;
        if (jobIsAssigned(job.firstPincher, this.assignments) && jobIsAssigned(job.secondPincher, this.assignments)) {
          const first = findByJob(job.firstPincher, this.assignments);
          const second = findByJob(job.secondPincher, this.assignments);
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

    if (!jobIsAssigned(job.moveCursor, this.assignments) && shouldMoveCursor(touch, this.raycaster)) {
      const assignment = assign(touch, job.moveCursor, this.assignments);
      assignment.cursorPose = new Pose().fromCameraProjection(
        document.querySelector("#player-camera").components.camera.camera,
        (touch.clientX / window.innerWidth) * 2 - 1,
        -(touch.clientY / window.innerHeight) * 2 + 1
      );
      return;
    }

    if (!jobIsAssigned(job.moveCamera, this.assignments)) {
      const assignment = assign(touch, job.moveCamera, this.assignments);
      assignment.clientX = touch.clientX;
      assignment.clientY = touch.clientY;
      assignment.delta = [0, 0];
      return;
    }

    if (!jobIsAssigned(job.secondPincher, this.assignments)) {
      let first;
      if (jobIsAssigned(job.firstPincher, this.assignments)) {
        first = findByJob(job.firstPincher, this.assignments);
      } else {
        const cameraMover = findByJob(job.moveCamera, this.assignments);
        unassign(cameraMover.touch, cameraMover.job, this.assignments);

        const first = assign(cameraMover.touch, job.firstPincher, this.assignments);
        first.clientX = cameraMover.clientX;
        first.clientY = cameraMover.clientY;
      }

      const second = assign(touch, job.secondPincher, this.assignments);
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
    let cameraMover = jobIsAssigned(job.moveCamera, this.assignments) && findByJob(job.moveCamera, this.assignments);
    if (this.pinch) {
      this.pinch.delta = 0;
    }
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

    const cursorPose =
      jobIsAssigned(job.moveCursor, this.assignments) && findByJob(job.moveCursor, this.assignments).cursorPose;
    cameraMover = jobIsAssigned(job.moveCamera, this.assignments) && findByJob(job.moveCamera, this.assignments);

    const path = paths.device.touchscreen;
    frame[path.cursorPose] = cursorPose ? cursorPose : undefined;
    frame[path.isTouchingGrabbable] = cursorPose ? true : undefined;
    frame[path.cameraDelta] = cameraMover ? cameraMover.delta : undefined;
    frame[path.pinchDelta] = this.pinch ? this.pinch.delta : undefined;
  }
}
