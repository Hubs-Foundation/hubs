import { deviceSetBindings } from "./actions/bindings";
import { sets } from "./actions/sets";
import { devices } from "./actions/devices";
import { smartMouse } from "./actions/smartMouse";

function difference(setA, setB) {
  const _difference = new Set(setA);
  setB.forEach(elem => {
    _difference.delete(elem);
  });
  return _difference;
}

function resolvePriorityConflict() {}
function resolve(frame, binding) {
  const { src, dest, xform, priority } = binding;
  const priorityConflict = priority == "conflict";
  if (priorityConflict) {
    resolvePriorityConflict(frame, binding);
  } else {
    xform(frame, src, dest);
  }
}

function applyChange(sets, change) {
  const { set, fn } = change;
  if (fn === "activate") {
    sets.add(set);
  } else if (fn === "deactivate") {
    sets.delete(set);
  }
}

const activeDeviceNames = new Set([devices.mouse.name, devices.smartMouse.name]);
const activeSets = new Set([sets.global]);
function getActiveBindings() {
  let activeBindings = [];
  deviceSetBindings.forEach(x => {
    const { device, set, bindings } = x;
    if (activeDeviceNames.has(device) && activeSets.has(set)) {
      activeBindings = activeBindings.concat(bindings);
    }
  });
  return activeBindings;
}
const callbacks = [];
let pendingSetChanges = [];
let frame = {};
let activeBindings = [];
// TODO: Handle device (dis/re)connection
AFRAME.registerSystem("actions", {
  init() {
    activeDeviceNames.forEach(name => {
      devices[name].init();
    });
  },

  tick() {
    pendingSetChanges.forEach(change => {
      applyChange(activeSets, change);
    });
    pendingSetChanges = [];

    const deviceFrame = {};
    activeDeviceNames.forEach(name => {
      devices[name].write(deviceFrame); // smartMouse runs after mouse
    });

    frame = {};
    Object.assign(frame, deviceFrame);
    activeBindings = getActiveBindings();
    activeBindings.forEach(binding => {
      resolve(frame, binding);
    });

    const cursorController = document.querySelector("[cursor-controller]").components["cursor-controller"];
    cursorController.actionSystemCallback(frame);
    // Callbacks are here to let app code activate or deactivate an action set THIS FRAME.

    const prevActiveSets = new Set(activeSets);
    pendingSetChanges.forEach(change => {
      applyChange(activeSets, change);
    });
    pendingSetChanges = [];
    if (difference(prevActiveSets, activeSets).size || difference(activeSets, prevActiveSets).size) {
      frame = {};
      Object.assign(frame, deviceFrame);
      activeBindings = getActiveBindings();
      activeBindings.forEach(binding => {
        resolve(frame, binding);
      });
    }
    this.debugFrame = frame;
  },

  poll(path) {
    return frame[path];
  },

  activate(set) {
    pendingSetChanges.push({ set, fn: "activate" });
  },

  deactivate(set) {
    pendingSetChanges.push({ set, fn: "deactivate" });
  },

  registerTickCallback(cb) {
    callbacks.push(cb);
  }
});
