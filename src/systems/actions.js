import {
  KBMBindings,
  gamepadBindings,
  touchscreenBindings,
  keyboardDebugBindings,
  xboxBindings,
  oculusGoBindings
} from "./actions/bindings";
import { sets } from "./actions/sets";
import { paths } from "./actions/paths";

import MouseDevice from "./actions/devices/mouse";
import KeyboardDevice from "./actions/devices/keyboard";
import SmartMouseDevice from "./actions/devices/smartMouse";
import GamepadDevice from "./actions/devices/gamepad";
import TouchscreenDevice from "./actions/devices/touchscreen";
import Hud from "./actions/devices/hud";
import XboxController from "./actions/devices/xbox";
import OculusGoController from "./actions/devices/oculusgo";

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

const activeSets = new Set([sets.global]);
const registeredMappings = new Set();

function prioritizeBindings(prioritizedBindings, activeBindings) {
  registeredMappings.forEach(mapping => {
    activeSets.forEach(setName => {
      const set = mapping[setName] || [];
      set.forEach(binding => {
        const { root, priority } = binding;
        if (!root || !priority) {
          // priority info not found : activate
          activeBindings.add(binding);
          return;
        }
        if (!prioritizedBindings.has(root)) {
          // root seen for the first time : activate
          prioritizedBindings.set(root, binding);
          activeBindings.add(binding);
          return;
        }
        const prevPriority = prioritizedBindings.get(root).priority;
        if (priority < prevPriority) {
          // priority too low : deactivate
          // pause debugger here to see when bindings never get activated,
          // because their priority is not the highest for this root.
          return;
        }
        if (priority > prevPriority) {
          // priority is higher : deactivate binding stored for this root
          // pause debugger here to step thru bindings getting overwritten this frame
          activeBindings.delete(prioritizedBindings.get(root));
          prioritizedBindings.delete(root);
          prioritizedBindings.set(root, binding);
          activeBindings.add(binding);
          return;
        }
        if (prevPriority === priority) {
          // (?) perhaps we could allow this somehow
          console.error("equal priorities on same root", binding, prioritizedBindings.get(root));
          return;
        }
      });
    });
  });
}

const callbacks = [];
let pendingSetChanges = [];
let frame = {};
const activeDevices = new Set();
const gamepads = {};
window.addEventListener(
  "gamepadconnected",
  e => {
    console.log("XBOX CONTROLELR!");
    const gamepadDevice = new OculusGoController(e.gamepad);
    activeDevices.add(gamepadDevice);
    gamepads[e.gamepad.index] = gamepadDevice;
  },
  false
);
window.addEventListener(
  "gamepaddisconnected",
  e => {
    if (gamepads[e.gamepad.index]) {
      activeDevices.delete(gamepads[e.gamepad.index]);
      delete gamepads[e.gamepad.index];
    }
  },
  false
);

AFRAME.registerSystem("actions", {
  init() {
    // TODO: Handle device (dis/re)connection
    //activeDevices.add(new MouseDevice());
    //activeDevices.add(new SmartMouseDevice());
    activeDevices.add(new KeyboardDevice());
    // activeDevices.add(new TouchscreenDevice());
    activeDevices.add(new Hud());

    //registeredMappings.add(KBMBindings);
    //registeredMappings.add(gamepadBindings);
    // registeredMappings.add(touchscreenBindings);
    registeredMappings.add(keyboardDebugBindings);
    //registeredMappings.add(xboxBindings);
    registeredMappings.add(oculusGoBindings);
  },

  tick() {
    pendingSetChanges.forEach(change => {
      applyChange(activeSets, change);
    });
    pendingSetChanges = [];

    const deviceFrame = {};
    activeDevices.forEach(device => {
      device.write(deviceFrame);
    });

    frame = {};
    Object.assign(frame, deviceFrame);
    const priorityMap = new Map();
    const activeBindings = new Set();
    prioritizeBindings(priorityMap, activeBindings);
    activeBindings.forEach(binding => {
      resolve(frame, binding);
    });

    const cursorController = document.querySelector("[cursor-controller]").components["cursor-controller"];
    cursorController.actionSystemCallback(frame);
    // (?) We could put callbacks here to let app code activate or deactivate an action set THIS FRAME.
    // (?) Cursors (and possibly colliders?) can know whether they've targetted something THIS FRAME.

    const prevActiveSets = new Set(activeSets);
    pendingSetChanges.forEach(change => {
      applyChange(activeSets, change);
    });
    pendingSetChanges = [];
    if (difference(prevActiveSets, activeSets).size || difference(activeSets, prevActiveSets).size) {
      frame = {};
      Object.assign(frame, deviceFrame);
      const priorityMap = new Map();
      const activeBindings = new Set();
      prioritizeBindings(priorityMap, activeBindings);
      activeBindings.forEach(binding => {
        resolve(frame, binding);
      });
    }
    this.frame = frame;
    this.activeSets = activeSets;
    this.activeBindings = activeBindings;
    if (frame[paths.app.logDebugFrame]) {
      console.log("frame", this.frame);
      console.log("sets", this.activeSets);
      console.log("bindings", this.activeBindings);
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
