import { touchBindDefn } from "../binding-definitions";
import styles from "./touch-frame.css";

touchBindDefn.forEach(binding => {
  if (binding.priorityKey) return;
  // Generate default priorityKey
  binding.priorityKey = "touch" + binding.set + binding.action + binding.filter;
});

const eventQueueLeftJoystick = [];
const capture = function capture(e) {
  this.push(e);
};

const leftTouchZone = document.createElement("div");
leftTouchZone.classList.add(styles.touchZone, styles.left);
if (document.body) {
  document.body.appendChild(leftTouchZone);
} else {
  window.setTimeout(() => {
    document.body.appendChild(leftTouchZone);
  }, 1000);
}
leftTouchZone.addEventListener("touchstart", capture.bind(eventQueueLeftJoystick));
leftTouchZone.addEventListener("touchmove", capture.bind(eventQueueLeftJoystick));
document.addEventListener("touchend", capture.bind(eventQueueLeftJoystick));
document.addEventListener("touchcancel", capture.bind(eventQueueLeftJoystick));

const remember = function remember(frame, prevFrame) {
  for (const key in frame) {
    if (frame[key]) {
      prevFrame[key] = frame[key];
    }
  }
  return prevFrame;
};

let isLeftJoystickInUse = false;
let leftJoystickTouchIdentifier = -1;
const framify = function framify(queue, frame) {
  for (let i = 0; i < queue.length; i++) {
    const event = queue[i];
    for (let j = 0; j < event.changedTouches.length; j++) {
      const touch = event.changedTouches[j];
      switch (event.type) {
        case "touchstart":
        case "touchmove":
          if (isLeftJoystickInUse && touch.identifier !== leftJoystickTouchIdentifier) break;
          leftJoystickTouchIdentifier = touch.identifier;
          isLeftJoystickInUse = true;
          frame["joystickLeft"] = [0, 1]; //TODO: Calculate distance from center of leftTouchZone
          break;
        case "touchend":
        case "touchcancel":
          if (!isLeftJoystickInUse || touch.identifier !== leftJoystickTouchIdentifier) break;
          isLeftJoystickInUse = false;
          leftJoystickTouchIdentifier = -1;
          frame["joystickLeft"] = [0, 0]; // garbage
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

function defaultValue(filter) {
  let action;
  switch (filter) {
    case "vec2":
      action = [0, 0];
      break;
  }
  return action;
}

let prevFrameLeftJoystick = {};
let frameLeftJoystick = {};
export const leftJoystick = {
  name: "touch (left joystick)",
  bindDefn: touchBindDefn,
  state: {
    prevFrame: prevFrameLeftJoystick,
    frame: frameLeftJoystick,
    eventQueue: eventQueueLeftJoystick
  },
  fillActionFrame: function fillActionFrame(sets, priorities, actions) {
    let { prevFrame, frame } = this.state;
    const { eventQueue } = this.state;
    prevFrame = {}; // garbage
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

    eventQueue.length = 0; // garbage
  },

  resolvePriorityConflicts: function resolvePriorityConflicts(sets, priorities, actions) {
    this.bindDefn.forEach(binding => {
      const { set, priorityKey } = binding;
      if (!priorities[priorityKey].actions.includes(binding.action)) {
        const action = defaultValue(binding.action);
        actions[binding.action] = action;
      }
    });
  }
};
