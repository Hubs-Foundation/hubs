let debug = false;

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

let prevDeviceFrame = {};
let deviceFrame = {
  normalizedCoords: [0, 0],
  wheel: 0
};
const remember = function remember(deviceFrame, prevDeviceFrame) {
  for (const key in deviceFrame) {
    if (deviceFrame[key]) {
      prevDeviceFrame[key] = true;
    }
  }
  return prevDeviceFrame;
};

const consume = function consume(queue, frame) {
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

const sets = [
  "notTransientLooking", // when active will poll "transientLook" to activate set "transientLooking"
  "transientLooking", // when active and "isLooking", will poll "look" to look around
  "notLockedLooking", // when active, will poll "startLockedLooking" to deactivate self and activate set "lockedLooking"
  "lockedLooking", // when active, will poll "look" to look around
  //            , will poll "stopLockedLooking" to deactivate self and activate set "notLockedLooking"
  "cursorMoving", // when active, will poll "cursorMovement" to drive the cursor around
  "targetHovering", // when active, will poll "grabTargettedObject" to deactivate self and activate "objectMoving"
  "objectMoving" // when active, will poll "dropGrabbedObject" to deactivate self
];
const bindDefn = [
  {
    action: "startTransientLook",
    set: "notTransientLooking",
    filter: "keydown",
    key: "left",
    priority: 1,
    priorityKey: "leftMouseDown"
  },
  {
    action: "stopTransientLook",
    set: "transientLooking",
    filter: "keyup",
    key: "left",
    priority: 1,
    priorityKey: "leftMouseDown"
  },
  {
    action: "look",
    set: "transientLooking",
    filter: "vec2_deltas",
    filterParams: {
      horizontalLookSpeed: 0.1,
      verticalLookSpeed: 0.06,
      keys: ["dY", "dX"],
      filters: ["number", "number"]
    },
    priority: 2,
    priorityKey: "mousemove"
  },
  {
    action: "startLockedLook",
    set: "notLockedLooking",
    filter: "keydown",
    key: "right"
  },
  {
    action: "stopLockedLook",
    set: "lockedLooking",
    filter: "keydown",
    key: "right"
  },
  {
    action: "look",
    set: "lockedLooking",
    filter: "vec2_deltas",
    filterParams: {
      horizontalLookSpeed: 0.1,
      verticalLookSpeed: 0.06,
      keys: ["dY", "dX"],
      filters: ["number", "number"]
    },
    priority: 4,
    priorityKey: "mousemove"
  },
  {
    action: "cursorMovement",
    set: "cursorMoving",
    filter: "vec2",
    key: "normalizedCoords",
    priority: 1,
    priorityKey: "mousemove"
  },
  {
    action: "cursorMovement",
    set: "objectMoving",
    filter: "vec2",
    key: "normalizedCoords",
    priority: 3,
    priorityKey: "mousemove"
  },
  {
    action: "grabTargettedObject",
    set: "targetHovering",
    filter: "keydown",
    key: "left"
  },
  {
    action: "dropGrabbedObject",
    set: "objectMoving",
    filter: "keyup",
    key: "left",
    priority: 2,
    priorityKey: "leftMouseDown"
  },
  {
    action: "dCursorDistanceMod",
    set: "objectMoving",
    filter: "number",
    key: "wheel"
  }
];

const vec2_deltas = function vec2_deltas() {
  return {
    vec2: [0, 0],
    filter: function filter({ horizontalLookSpeed, verticalLookSpeed, keys, filters }, deviceFrame, prevDeviceFrame) {
      const sign = this.invertMouseLook ? 1 : -1;
      this.vec2[0] = deviceFrame[keys[0]] * verticalLookSpeed * sign;
      this.vec2[1] = deviceFrame[keys[1]] * horizontalLookSpeed * sign;
      return this.vec2;
    }
  };
};

const actionFrame = {
  dCursorDistanceMod: 0,
  look: [0, 0],
  cursorMovement: [0, 0]
};
const activeActionSets = ["notTransientLooking", "notLockedLooking", "cursorMoving"];
let priority = {};
window.activeActionSets = activeActionSets;
const fillActionFrameFromBinding = function fillActionFrameFromBinding(
  binding,
  deviceFrame,
  prevDeviceFrame,
  actionFrame
) {
  const setIsActive = activeActionSets.indexOf(binding.set) !== -1;
  if (!setIsActive) return; // leave actionFrame[binding.action] as it is
  let action;
  switch (binding.filter) {
    case "keydown":
      action = !prevDeviceFrame[binding.key] && deviceFrame[binding.key];
      break;
    case "keyup":
      action = prevDeviceFrame[binding.key] && !deviceFrame[binding.key];
      break;
    case "key":
    case "vec2":
    case "number":
      action = deviceFrame[binding.key];
      break;
    case "nokey":
      action = !deviceFrame[binding.key];
      break;
    case "vec2_deltas":
      if (!binding.filterFn) {
        binding.filterFn = vec2_deltas();
      }
      action = binding.filterFn.filter(binding.filterParams, deviceFrame, prevDeviceFrame);
      break;
  }

  if (binding.priority && (!priority[binding.priorityKey] || priority[binding.priorityKey].value < binding.priority)) {
    priority[binding.priorityKey] = { value: binding.priority, action: binding.action };
  }

  actionFrame[binding.action] = action;
};

const fillActionFrame = function fillActionFrame(bindDefn, deviceFrame, prevDeviceFrame, actionFrame) {
  for (let i = 0; i < bindDefn.length; i++) {
    const binding = bindDefn[i];
    fillActionFrameFromBinding(binding, deviceFrame, prevDeviceFrame, actionFrame);
    if (debug && actionFrame[binding.action] && binding.filter === "keydown") {
      console.log(binding.action);
    }
  }
};

const resolvePriorityConflicts = function resolvePriorityConflicts(bindDefn, actionFrame) {
  for (let i = 0; i < bindDefn.length; i++) {
    const binding = bindDefn[i];
    const setIsActive = activeActionSets.indexOf(binding.set) !== -1;
    if (!setIsActive || !binding.priority) continue;
    if (
      priority[binding.priorityKey].value > binding.priority &&
      priority[binding.priorityKey].action !== binding.action
    ) {
      let action;
      switch (binding.filter) {
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

      actionFrame[binding.action] = action;
    }
  }
};

const activeSetQueue = [];
AFRAME.registerSystem("mouseFrame", {
  init() {},

  tick() {
    for (const set of activeSetQueue) {
      switch (set.change) {
        case "activate":
          activeActionSets.push(set.name);
          break;
        case "deactivate":
          if (activeActionSets.indexOf(set.name) === -1) continue;
          activeActionSets.splice(activeActionSets.indexOf(set.name), 1);
          break;
      }
    }
    activeSetQueue.length = 0;

    prevDeviceFrame = {}; // garbage
    prevDeviceFrame = remember(deviceFrame, prevDeviceFrame);
    deviceFrame = consume(eventQueue, deviceFrame);
    eventQueue.length = 0;
    priority = {};
    fillActionFrame(bindDefn, deviceFrame, prevDeviceFrame, actionFrame);
    resolvePriorityConflicts(bindDefn, actionFrame);
  },

  poll(action) {
    return actionFrame[action];
  },

  activateSet(set) {
    activeSetQueue.push({ change: "activate", name: set });
  },

  deactivateSet(set) {
    activeSetQueue.push({ change: "deactivate", name: set });
  },

  isActive(set) {
    return activeActionSets.indexOf(set) !== -1;
  },

  setDebug(d) {
    debug = d;
  }
});
