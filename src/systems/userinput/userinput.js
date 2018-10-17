import { paths } from "./paths";
import { sets } from "./sets";

// User input is supplied by devices.
import { MouseDevice } from "./devices/mouse";
import { KeyboardDevice } from "./devices/keyboard";
import { HudDevice } from "./devices/hud";
import { XboxControllerDevice } from "./devices/xbox-controller";
import { OculusGoControllerDevice } from "./devices/oculus-go-controller";
import { OculusTouchControllerDevice } from "./devices/oculus-touch-controller";
import { DaydreamControllerDevice } from "./devices/daydream-controller";

// App-aware devices need references to entities in the scene.
import { AppAwareMouseDevice } from "./devices/app-aware-mouse";
import { AppAwareTouchscreenDevice } from "./devices/app-aware-touchscreen";

// Bindings determine how user input is transformed to fill the values stored in the frame at action paths.
// Intermediate values are also stored in the frame when transformations are called..
import { keyboardMouseUserBindings } from "./bindings/keyboard-mouse-user";
import { touchscreenUserBindings } from "./bindings/touchscreen-user";
import { keyboardDebuggingBindings } from "./bindings/keyboard-debugging";
import { oculusGoUserBindings } from "./bindings/oculus-go-user";
import { oculusTouchUserBindings } from "./bindings/oculus-touch-user";
import { xboxControllerUserBindings } from "./bindings/xbox-controller-user";
import { daydreamUserBindings } from "./bindings/daydream-user";

import { updateActionSetsBasedOnSuperhands } from "./resolve-action-sets";
import { GamepadDevice } from "./devices/gamepad";
import { gamepadBindings } from "./bindings/generic-gamepad";

function prioritizeBindings(registeredMappings, activeSets, prioritizedBindings, activeBindings) {
  registeredMappings.forEach(mapping => {
    Object.keys(mapping).forEach(setName => {
      if (!activeSets.has(setName)) return;

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

AFRAME.registerSystem("userinput", {
  readFrameValueAtPath(path) {
    return this.frame && this.frame[path];
  },

  toggleActive(set, value) {
    this.pendingSetChanges.push({ set, value });
  },

  activate(set) {
    this.pendingSetChanges.push({ set, value: true });
  },

  deactivate(set) {
    this.pendingSetChanges.push({ set, value: false });
  },

  init() {
    this.activeSets = new Set([sets.global]);
    this.pendingSetChanges = [];
    this.activeDevices = new Set([new MouseDevice(), new AppAwareMouseDevice(), new KeyboardDevice(), new HudDevice()]);

    this.registeredMappings = new Set([keyboardDebuggingBindings]);
    this.xformStates = new Map();

    this.gamepads = [];

    if (AFRAME.utils.device.isMobile()) {
      window.addEventListener(
        "touchdown",
        () => {
          this.activeDevices.add(new AppAwareTouchscreenDevice());
          this.registeredMappings.add(touchscreenUserBindings);
        },
        {
          once: true,
          passive: true
        }
      );
    }

    window.addEventListener(
      "gamepadconnected",
      e => {
        console.log(e.gamepad);
        let gamepadDevice;
        if (e.gamepad.id.startsWith("Oculus Touch")) {
          gamepadDevice = new OculusTouchControllerDevice(e.gamepad);
          this.registeredMappings.add(oculusTouchUserBindings);
        } else if (e.gamepad.id === "Oculus Go Controller") {
          gamepadDevice = new OculusGoControllerDevice(e.gamepad);
          this.registeredMappings.add(oculusGoUserBindings);
        } else if (e.gamepad.id === "Daydream Controller") {
          gamepadDevice = new DaydreamControllerDevice(e.gamepad);
          this.registeredMappings.add(daydreamUserBindings);
        } else if (e.gamepad.id.includes("Xbox")) {
          gamepadDevice = new XboxControllerDevice(e.gamepad);
          this.registeredMappings.add(xboxControllerUserBindings);
        } else {
          gamepadDevice = new GamepadDevice(e.gamepad);
          this.registeredMappings.add(gamepadBindings);
        }
        this.activeDevices.add(gamepadDevice);
        this.gamepads[e.gamepad.index] = gamepadDevice;
      },
      false
    );
    window.addEventListener(
      "gamepaddisconnected",
      e => {
        if (this.gamepads[e.gamepad.index]) {
          this.activeDevices.delete(this.gamepads[e.gamepad.index]);
          delete this.gamepads[e.gamepad.index];
        }
      },
      false
    );
  },

  tick() {
    updateActionSetsBasedOnSuperhands();

    this.pendingSetChanges.forEach(({ set, value }) => {
      this.activeSets[value ? "add" : "delete"](set);
    });
    this.pendingSetChanges = [];

    const frame = {};
    this.activeDevices.forEach(device => {
      device.write(frame);
    });

    const priorityMap = new Map();
    const activeBindings = new Set();
    prioritizeBindings(this.registeredMappings, this.activeSets, priorityMap, activeBindings);
    activeBindings.forEach(binding => {
      const bindingExistedLastFrame = activeBindings && activeBindings.has(binding);
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
    this.activeBindings = activeBindings;
    if (frame[paths.actions.logDebugFrame]) {
      console.log("frame", this.frame);
      console.log("sets", this.activeSets);
      console.log("bindings", this.activeBindings);
      console.log("devices", this.activeDevices);
      console.log("xformStates", this.xformStates);
    }
  }
});
