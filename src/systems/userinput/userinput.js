import { MouseDevice } from "./devices/mouse";
import { KeyboardDevice } from "./devices/keyboard";
import { SmartMouseDevice } from "./devices/smartMouse";
import { GamepadDevice } from "./devices/gamepad";
import { TouchscreenDevice } from "./devices/touchscreen";
import { Hud } from "./devices/hud";
import { XboxController } from "./devices/xbox";
import { OculusGoController } from "./devices/oculusgo";
import { RightOculusTouch } from "./devices/rightOculusTouch";
import { LeftOculusTouch } from "./devices/leftOculusTouch";
import { KBMBindings } from "./bindings/KBMBindings";
import { gamepadBindings } from "./bindings/gamepadBindings";
import { touchscreenBindings } from "./bindings/touchscreenBindings";
import { keyboardDebugBindings } from "./bindings/keyboardDebugBindings";
import { oculusgoBindings } from "./bindings/oculusgoBindings";
import { oculustouchBindings } from "./bindings/oculustouchBindings";
import { paths } from "./paths";
import { sets } from "./sets";
import { updateActionSetsBasedOnSuperhands } from "./resolve-action-sets";

function difference(setA, setB) {
  const _difference = new Set(setA);
  setB.forEach(elem => {
    _difference.delete(elem);
  });
  return _difference;
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
    console.log(e.gamepad);
    if (e.gamepad.id === "Oculus Touch (Left)") {
      const gamepadDevice = new LeftOculusTouch(e.gamepad);
      activeDevices.add(gamepadDevice);
      gamepads[e.gamepad.index] = gamepadDevice;
    } else if (e.gamepad.id === "Oculus Touch (Right)") {
      const gamepadDevice = new RightOculusTouch(e.gamepad);
      activeDevices.add(gamepadDevice);
      gamepads[e.gamepad.index] = gamepadDevice;
    } else if (e.gamepad.id.includes("Xbox")) {
      const gamepadDevice = new XboxController(e.gamepad);
      activeDevices.add(gamepadDevice);
      gamepads[e.gamepad.index] = gamepadDevice;
    } else {
      const gamepadDevice = new OculusGoController(e.gamepad);
      activeDevices.add(gamepadDevice);
      gamepads[e.gamepad.index] = gamepadDevice;
    }
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

AFRAME.registerSystem("userinput", {
  init() {
    // TODO: Handle device (dis/re)connection
    activeDevices.add(new MouseDevice());
    activeDevices.add(new SmartMouseDevice());
    activeDevices.add(new KeyboardDevice());
    activeDevices.add(new TouchscreenDevice());
    activeDevices.add(new Hud());

    registeredMappings.add(KBMBindings);
    //registeredMappings.add(gamepadBindings);
    //registeredMappings.add(touchscreenBindings);
    //registeredMappings.add(xboxBindings);
    registeredMappings.add(keyboardDebugBindings);
    //registeredMappings.add(oculusgoBindings);
    this.xformStates = new Map();
    registeredMappings.add(oculustouchBindings);
  },

  tick() {
    updateActionSetsBasedOnSuperhands();
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
      const bindingExistedLastFrame = this.activeBindings && this.activeBindings.has(binding);
      if (!bindingExistedLastFrame) {
        this.xformStates.delete(binding);
      }

      const { src, dest, xform } = binding;
      const newState = xform(frame, src, dest, this.xformStates.get(binding));
      if (newState !== undefined) {
        this.xformStates.set(binding, newState);
      }
    });

    this.frame = frame;
    this.activeSets = activeSets;
    this.activeBindings = activeBindings;
    if (frame[paths.actions.logDebugFrame]) {
      console.log("frame", this.frame);
      console.log("sets", this.activeSets);
      console.log("bindings", this.activeBindings);
      console.log("devices", activeDevices);
      console.log("xformStates", this.xformStates);
    }
    if (frame[paths.actions.drawDebugFrame]) {
      // TODO: draw debug data to the screen
    }
  },

  readValueAtPath(path) {
    return frame[path];
  },

  activate(set, value) {
    pendingSetChanges.push({ set, fn: value === false ? "deactivate" : "activate" });
  },

  deactivate(set) {
    pendingSetChanges.push({ set, fn: "deactivate" });
  },

  registerTickCallback(cb) {
    callbacks.push(cb);
  }
});
