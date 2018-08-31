import { mouseBindDefn } from "./binding-definitions";

mouseBindDefn.forEach(binding => {
  if (binding.priorityKey) return;
  // Generate default priorityKey
  binding.priorityKey = "mouse" + binding.set + binding.action + binding.filter;
});

const eventQueue = [];
const capture = function capture(e) {
  this.push(e);
};
document.addEventListener("mousedown", capture.bind(eventQueue));
document.addEventListener("mousemove", capture.bind(eventQueue));
document.addEventListener("mouseup", capture.bind(eventQueue));
document.addEventListener("wheel", capture.bind(eventQueue));
const prevent = function prevent(e) {
  e.preventDefault();
};
document.addEventListener("contextmenu", prevent.bind(eventQueue));

const remember = function remember(frame, prevFrame) {
  for (const key in frame) {
    if (frame[key]) {
      prevFrame[key] = true;
    }
  }
  return prevFrame;
};

const framify = function framify(queue, frame) {
  frame["wheel"] = 0;
  frame["dY"] = 0;
  frame["dX"] = 0;
  for (let i = 0; i < queue.length; i++) {
    const event = queue[i];
    switch (event.type) {
      case "mousedown":
        switch (event.button) {
          case 0:
            frame["left"] = true;
            break;
          case 2:
            frame["right"] = true;
            break;
        }
        break;
      case "mouseup":
        switch (event.button) {
          case 0:
            frame["left"] = false;
            break;
          case 2:
            frame["right"] = false;
            break;
        }
        break;
      case "mousemove":
        frame["normalizedCoords"] = [
          (event.clientX / window.innerWidth) * 2 - 1,
          -(event.clientY / window.innerHeight) * 2 + 1
        ];
        frame["dY"] += event.movementY;
        frame["dX"] += event.movementX;
        break;
      case "wheel":
        switch (event.deltaMode) {
          case event.DOM_DELTA_PIXEL:
            frame["wheel"] += event.deltaY / 500;
            break;
          case event.DOM_DELTA_LINE:
            frame["wheel"] += event.deltaY / 10;
            break;
          case event.DOM_DELTA_PAGE:
            frame["wheel"] += event.deltaY / 2;
            break;
        }
        break;
    }
  }
  return frame;
};

const vec2_deltas = function vec2_deltas() {
  return {
    vec2: [0, 0],
    // TODO: filters here is unused, because instead of calling `actionForBinding`
    //       for each of the inputs to the filter here, we instead do this weird thing.
    //       In the future, I think the correct thing to do for filters will involve
    //       calling `actionForBinding` recursively to resolve all of the inputs to
    //       a given filter.
    //       Until we do that, we won't be able to (for example) build a filter out
    //       of filtered input, which definitely adds value (especially when user
    //       configuration is a thing, see steam controller configurations).
    filter: function filter({ horizontalLookSpeed, verticalLookSpeed, keys, filters }, frame, prevFrame) {
      const sign = this.invertMouseLook ? 1 : -1;
      this.vec2[0] = frame[keys[0]] * verticalLookSpeed * sign;
      this.vec2[1] = frame[keys[1]] * horizontalLookSpeed * sign;
      return this.vec2;
    }
  };
};

function actionForBinding(binding, frame, prevFrame) {
  let action;
  switch (binding.filter) {
    case "keydown":
      action = !prevFrame[binding.key] && frame[binding.key];
      break;
    case "keyup":
      action = prevFrame[binding.key] && !frame[binding.key];
      break;
    case "key":
    case "vec2":
    case "number":
      action = frame[binding.key];
      break;
    case "nokey":
      action = !frame[binding.key];
      break;
    case "vec2_deltas":
      if (!binding.filterFn) {
        binding.filterFn = vec2_deltas();
      }
      action = binding.filterFn.filter(binding.filterParams, frame, prevFrame);
      break;
  }
  return action;
}

function defaultValue(filter) {
  let action;
  switch (filter) {
    case "number":
      action = 0;
      break;
    case "vec2_deltas":
    case "vec2":
      action = [0, 0];
      break;
    case "key":
    case "keydown":
    case "keyup":
      action = false;
      break;
    case "nokey":
      action = false; // I guess?
      break;
  }
  return action;
}

export const mouse = {
  name: "mouse",
  bindDefn: mouseBindDefn,
  state: {
    prevFrame: {},
    frame: {},
    eventQueue
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
