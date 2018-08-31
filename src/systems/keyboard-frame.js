import { keyboardBindDefn } from "./binding-definitions";

// Generate default priority keys
keyboardBindDefn.forEach(binding => {
  if (binding.priorityKey) return;
  binding.priorityKey = "keyboard" + binding.set + binding.action + binding.filter;
});

const eventQueue = [];
const capture = function capture(e) {
  this.push(e);
};
document.addEventListener("keydown", capture.bind(eventQueue));
document.addEventListener("keyup", capture.bind(eventQueue));
document.addEventListener("blur", capture.bind(eventQueue));

function remember(keyFrame, prevKeyFrame) {
  for (const key in keyFrame) {
    if (keyFrame[key]) {
      prevKeyFrame[key] = true;
    }
  }
  return prevKeyFrame;
}

function framify(queue, frame) {
  for (let i = 0; i < queue.length; i++) {
    const event = queue[i];
    switch (event.type) {
      case "keydown":
        frame[event.key.toLowerCase()] = true;
        break;
      case "keyup":
        frame[event.key.toLowerCase()] = false;
        break;
      case "blur":
        for (const key in frame) {
          frame[key] = false;
        }
        break;
    }
  }
  return frame;
}

function key4_to_vec2() {
  return {
    key4: [false, false, false, false],
    vec2: [0, 0],
    filter: function filter({ keys, filters }, frame, prevFrame) {
      for (let i = 0; i < this.key4.length; i++) {
        const key = keys[i];
        const filter = filters[i];
        switch (filter) {
          case "keydown":
            this.key4[i] = !prevFrame[key] && frame[key];
            break;
          case "keyup":
            this.key4[i] = prevFrame[key] && !frame[key];
            break;
          case "key":
            this.key4[i] = frame[key];
            break;
          case "nokey":
            this.key4[i] = !frame[key];
            break;
        }
      }
      this.vec2[0] = (this.key4[0] ? 1 : 0) + (this.key4[1] ? -1 : 0);
      this.vec2[1] = (this.key4[2] ? 1 : 0) + (this.key4[3] ? -1 : 0);
      return this.vec2;
    }
  };
}

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
      action = frame[binding.key];
      break;
    case "nokey":
      action = !frame[binding.key];
      break;
    case "key4_to_vec2":
      if (!binding.filterFn) {
        binding.filterFn = key4_to_vec2();
      }
      action = binding.filterFn.filter(binding.filter_params, frame, prevFrame);
      break;
  }
  return action;
}

export const keyboard = {
  name: "keyboard",
  state: {
    prevFrame: {},
    frame: {},
    eventQueue
  },
  bindDefn: keyboardBindDefn,
  fillActionFrame: function fillActionFrame(sets, priorities, actions) {
    let { prevFrame, frame, eventQueue } = this.state;
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
