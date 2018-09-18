import { deviceSetBindings } from "./actions/bindings";
import { sets } from "./actions/sets";
import { devices } from "./actions/devices";
import { paths } from "./actions/paths";

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

const activeDeviceNames = new Set([devices.mouse.name, devices.smartMouse.name, devices.keyboard.name]);
const activeSets = new Set([sets.global]);
function getActiveBindings() {
  const prioritizedBindings = new Map();
  const activeBindings = new Set();
  deviceSetBindings.forEach(x => {
    const { device, set, bindings } = x;
    if ((!device || activeDeviceNames.has(device)) && activeSets.has(set)) {
      bindings.forEach(binding => {
        const { root, priority } = binding;
        if (!root || !priority) {
          activeBindings.add(binding);
          return;
        }
        if (!prioritizedBindings.has(root)) {
          prioritizedBindings.set(root, binding);
          activeBindings.add(binding);
          return;
        }
        const prevPriority = prioritizedBindings.get(root).priority;
        if (prevPriority > priority) {
          return;
        }
        if (prevPriority < priority) {
          activeBindings.delete(prioritizedBindings.get(root));
          prioritizedBindings.delete(root);
          prioritizedBindings.set(root, binding);
          activeBindings.add(binding);
          return;
        }
        if (prevPriority === priority) {
          console.error("equal priorities on same root", binding, prioritizedBindings.get(root));
          return;
        }
      });
    }
  });
  return activeBindings;
}
const callbacks = [];
let pendingSetChanges = [];
let frame = {};
let activeBindings = new Set();
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
    if (frame[paths.app.logDebugFrame]) {
      console.log(JSON.stringify(this.debugFrame, null, " "));
    }
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
