const HORIZONTAL_LOOK_SPEED = 0.35;
const VERTICAL_LOOK_SPEED = 0.18;
import { touchBindDefn } from "./binding-definitions";
import { leftJoystick } from "./touch/left-joystick";
import { raycast } from "./touch/raycast";

touchBindDefn.forEach(binding => {
  if (binding.priorityKey) return;
  // Generate default priorityKey
  binding.priorityKey = "touch" + binding.set + binding.action + binding.filter;
});

const eventQueue = [];
const capture = function capture(e) {
  this.push(e);
};
document.addEventListener("touchstart", capture.bind(eventQueue));
document.addEventListener("touchmove", capture.bind(eventQueue));
document.addEventListener("touchend", capture.bind(eventQueue));
document.addEventListener("touchcancel", capture.bind(eventQueue));

function remember(frame, prevFrame) {
  for (const key in frame) {
    if (frame[key]) {
      prevFrame[key] = frame[key];
    }
  }
  return prevFrame;
}

function updateCameraMover(frame, prevFrame, touch) {
  frame["cameraMoverClient"] = [touch.clientY, touch.clientX];
  if (
    !prevFrame["cameraMoverClient"] ||
    (prevFrame["cameraMoverClient"][0] === 0 && prevFrame["cameraMoverClient"][1] === 0)
  ) {
    frame["cameraMoverVec2"] = [0, 0];
  } else {
    frame["cameraMoverVec2"] = [
      (touch.clientY - prevFrame["cameraMoverClient"][0]) * VERTICAL_LOOK_SPEED,
      (touch.clientX - prevFrame["cameraMoverClient"][1]) * HORIZONTAL_LOOK_SPEED
    ];
  }
}

let prevFrame = {};
let cursorMoverId = -1;
let cameraLookerId = -1;
const framify = function framify(queue, frame) {
  for (let i = 0; i < queue.length; i++) {
    const event = queue[i];
    for (let j = 0; j < event.changedTouches.length; j++) {
      const touch = event.changedTouches[j];
      switch (event.type) {
        case "touchstart":
          if (cursorMoverId === -1) {
            const targetX = (touch.clientX / window.innerWidth) * 2 - 1;
            const targetY = -(touch.clientY / window.innerHeight) * 2 + 1;
            if (raycast({ x: targetX,
                          y: targetY })) {
              cursorMoverId = touch.identifier;
              frame["cursorMoverVec2"] = [touch.clientX, touch.clientY];
              break;
            }
          }
          if (cameraLookerId === -1) {
            cameraLookerId = touch.identifier;
            updateCameraMover(frame, prevFrame, touch);
            break;
          }
          break;
        case "touchmove":
          if (touch.identifier === cursorMoverId) {
            frame["cursorMoverVec2"] = [touch.clientX, touch.clientY];
            break;
          }
          if (touch.identifier === cameraLookerId) {
            cameraLookerId = touch.identifier;
            updateCameraMover(frame, prevFrame, touch);
            break;
          }
          break;
        case "touchend":
        case "touchcancel":
          if (touch.identifier === cursorMoverId) {
            frame["cursorMoverVec2"] = [touch.clientX, touch.clientY];
            cursorMoverId = -1;
            break;
          }
          if (touch.identifier === cameraLookerId) {
            frame["cameraMoverClient"] = [0, 0];
            frame["cameraMoverVec2"] = [0, 0];
            cameraLookerId = -1;
            break;
          }
          break;
      }
    }
  }
  return frame;
};

function actionForBinding(binding, frame, prevFrame) {
  let action;
  switch (binding.filter) {
    case "vec2":
      action = frame[binding.key];
      break;
  }
  return action;
}

let frame = {};
export const touch = {
  name: "touch",
  bindDefn: touchBindDefn,
  state: {
    prevFrame,
    frame,
    eventQueue
  },
  fillActionFrame: function fillActionFrame(sets, priorities, actions) {

    let { prevFrame, frame } = this.state;
    const { eventQueue } = this.state;
    //    prevFrame = {}; // garbage
    prevFrame = _.each()
    prevFrame = remember(frame, prevFrame);
    frame = framify(eventQueue, frame);
    this.bindDefn.forEach(binding => {
      const { set, priorityKey } = binding;
      const priority = sets.indexOf(set);
      if (!priorities[priorityKey] || priorities[priorityKey].value < priority) {
        priorities[priorityKey] = { value: priority, actions: [] }; // garbage
      }
      if (priorities[priorityKey].value === priority) {
        const action = priority === -1 ? defaultValue(binding.action) : actionForBinding(binding, frame, prevFrame);
        priorities[priorityKey].actions.push(binding.action); // garbage
        actions[binding.action] = action;
      }
    });

    leftJoystick.fillActionFrame(sets, priorities, actions);

    eventQueue.length = 0; // garbage
  },

  resolvePriorityConflicts: function resolvePriorityConflicts(sets, priorities, actions) {
    leftJoystick.resolvePriorityConflicts(sets, priorities, actions);
  }
};
