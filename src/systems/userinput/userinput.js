import { sets } from "./sets";

import { MouseDevice } from "./devices/mouse";
import { KeyboardDevice } from "./devices/keyboard";
import { HudDevice } from "./devices/hud";
import { XboxControllerDevice } from "./devices/xbox-controller";
import { OculusGoControllerDevice } from "./devices/oculus-go-controller";
import { OculusTouchControllerDevice } from "./devices/oculus-touch-controller";
import { DaydreamControllerDevice } from "./devices/daydream-controller";
import { ViveControllerDevice } from "./devices/vive-controller";

import { AppAwareMouseDevice } from "./devices/app-aware-mouse";
import { AppAwareTouchscreenDevice } from "./devices/app-aware-touchscreen";

import { keyboardMouseUserBindings } from "./bindings/keyboard-mouse-user";
import { touchscreenUserBindings } from "./bindings/touchscreen-user";
import { keyboardDebuggingBindings } from "./bindings/keyboard-debugging";
import { oculusGoUserBindings } from "./bindings/oculus-go-user";
import { oculusTouchUserBindings } from "./bindings/oculus-touch-user";
import { viveUserBindings } from "./bindings/vive-user";
import { xboxControllerUserBindings } from "./bindings/xbox-controller-user";
import { daydreamUserBindings } from "./bindings/daydream-user";

import { resolveActionSets } from "./resolve-action-sets";
import { GamepadDevice } from "./devices/gamepad";
import { gamepadBindings } from "./bindings/generic-gamepad";

function intersection(setA, setB) {
  const _intersection = new Set();
  for (const elem of setB) {
    if (setA.has(elem)) {
      _intersection.add(elem);
    }
  }
  return _intersection;
}

const satisfiesPath = (binding, path) => {
  return Object.values(binding.dest) && Object.values(binding.dest).indexOf(path) !== -1;
};

const satisfyPath = (bindings, path) => {
  for (const binding of bindings) {
    if (satisfiesPath(binding, path)) {
      return true;
    }
  }
  return false;
};

const satisfiedBy = (binding, bindings) => {
  for (const path of Object.values(binding.src)) {
    if (path.startsWith("/device/")) continue;
    if (!satisfyPath(bindings, path)) return false;
  }
  return true;
};

function dependencySort(mappings) {
  const unsorted = [];
  for (const mapping of mappings) {
    for (const setName in mapping) {
      for (const binding of mapping[setName]) {
        unsorted.push(binding);
      }
    }
  }

  const sorted = [];
  while (unsorted.length > 0) {
    const binding = unsorted.shift();
    if (satisfiedBy(binding, sorted)) {
      sorted.push(binding);
    } else {
      unsorted.push(binding);
    }
  }

  return sorted;
}

function canMask(masker, masked) {
  if (masker.priority === undefined) {
    masker.priority = 0;
  }
  if (masked.priority === undefined) {
    masked.priority = 0;
  }
  if (masked.priority >= masker.priority) return false;
  for (const maskerPath of Object.values(masker.src)) {
    for (const maskedPath of Object.values(masked.src)) {
      if (maskedPath.indexOf(maskerPath) !== -1) {
        return true;
      }
    }
  }
  return false;
}

function computeMasks(bindings) {
  const masks = [];
  for (const row in bindings) {
    for (const col in bindings) {
      let ColCanMaskRow = false;
      if (canMask(bindings[col], bindings[row])) {
        ColCanMaskRow = true;
      }
      masks[Number(row) * bindings.length + Number(col)] = ColCanMaskRow;
    }
  }
  return masks;
}

function isActive(binding, sets) {
  for (const s of binding.sets) {
    if (sets.has(s)) {
      return true;
    }
  }
  return false;
}

function computeExecutionStrategy(sortedBindings, masks, activeSets) {
  const actives = [];
  for (const row in sortedBindings) {
    actives[row] = isActive(sortedBindings[row], activeSets);
  }

  const masked = [];
  for (const row in sortedBindings) {
    for (const col in sortedBindings) {
      const rowMask = masked[row] || [];
      if (masks[Number(row) * sortedBindings.length + Number(col)] && isActive(sortedBindings[col], activeSets)) {
        rowMask.push(col);
      }
      masked[row] = rowMask;
    }
  }

  return { actives, masked };
}

AFRAME.registerSystem("userinput", {
  get(path) {
    return this.frame && this.frame[path];
  },

  toggleSet(set, value) {
    this.pendingSetChanges.push({ set, value });
  },

  init() {
    this.frame = {};

    this.prevActiveSets = new Set();
    this.activeSets = new Set([sets.global]);
    this.pendingSetChanges = [];
    this.xformStates = new Map();
    this.activeDevices = new Set([new MouseDevice(), new AppAwareMouseDevice(), new KeyboardDevice(), new HudDevice()]);
    this.registeredMappings = new Set([keyboardDebuggingBindings]);
    this.registeredMappingsChanged = true;

    let connectedGamepadBindings;

    const appAwareTouchscreenDevice = new AppAwareTouchscreenDevice();

    const disableNonGamepadBindings = () => {
      if (AFRAME.utils.device.isMobile()) {
        this.activeDevices.delete(appAwareTouchscreenDevice);
        this.registeredMappings.delete(touchscreenUserBindings);
      } else {
        this.registeredMappings.delete(keyboardMouseUserBindings);
      }
    };

    const enableNonGamepadBindings = () => {
      if (AFRAME.utils.device.isMobile()) {
        this.activeDevices.add(appAwareTouchscreenDevice);
        this.registeredMappings.add(touchscreenUserBindings);
      } else {
        this.registeredMappings.add(keyboardMouseUserBindings);
      }
    };

    const updateBindingsForVRMode = () => {
      const inVRMode = this.el.sceneEl.is("vr-mode");

      if (inVRMode) {
        disableNonGamepadBindings();
        this.registeredMappings.add(connectedGamepadBindings);
      } else {
        enableNonGamepadBindings();
        this.registeredMappings.delete(connectedGamepadBindings);
      }
      this.registeredMappingsChanged = true;
    };
    this.el.sceneEl.addEventListener("enter-vr", updateBindingsForVRMode);
    this.el.sceneEl.addEventListener("exit-vr", updateBindingsForVRMode);
    updateBindingsForVRMode();

    window.addEventListener(
      "gamepadconnected",
      e => {
        let gamepadDevice;
        const entered = this.el.sceneEl.is("entered");
        for (let i = 0; i < this.activeDevices.length; i++) {
          const activeDevice = this.activeDevices[i];
          if (activeDevice.gamepad && activeDevice.gamepad === e.gamepad) {
            console.warn("ignoring gamepad", e.gamepad);
            return; // multiple connect events without a disconnect event
          }
        }
        if (e.gamepad.id === "OpenVR Gamepad") {
          gamepadDevice = new ViveControllerDevice(e.gamepad);
          connectedGamepadBindings = viveUserBindings;
        } else if (e.gamepad.id.startsWith("Oculus Touch")) {
          gamepadDevice = new OculusTouchControllerDevice(e.gamepad);
          connectedGamepadBindings = oculusTouchUserBindings;
        } else if (e.gamepad.id === "Oculus Go Controller") {
          gamepadDevice = new OculusGoControllerDevice(e.gamepad);
          connectedGamepadBindings = oculusGoUserBindings;
        } else if (e.gamepad.id === "Daydream Controller") {
          gamepadDevice = new DaydreamControllerDevice(e.gamepad);
          connectedGamepadBindings = daydreamUserBindings;
        } else if (e.gamepad.id.includes("Xbox")) {
          gamepadDevice = new XboxControllerDevice(e.gamepad);
          connectedGamepadBindings = xboxControllerUserBindings;
        } else {
          gamepadDevice = new GamepadDevice(e.gamepad);
          connectedGamepadBindings = gamepadBindings;
        }

        if (entered) {
          this.registeredMappings.add(connectedGamepadBindings);
        }

        this.activeDevices.add(gamepadDevice);
        this.registeredMappingsChanged = true;
      },
      false
    );
    window.addEventListener(
      "gamepaddisconnected",
      e => {
        for (const device of this.activeDevices) {
          if (device.gamepad === e.gamepad) {
            console.warn("NEED TO UPDATE REGISTERED MAPPINGS WHEN GAMEPAD DISCONNECTED!");
            this.activeDevices.delete(device);
            this.registeredMappingsChanged = true;
            return;
          }
        }
      },
      false
    );
  },

  tick() {
    const registeredMappingsChanged = this.registeredMappingsChanged;
    if (registeredMappingsChanged) {
      this.registeredMappingsChanged = false;
      this.prevSortedBindings = this.sortedBindings;
      this.sortedBindings = dependencySort(this.registeredMappings);
      if (!this.prevSortedBindings) {
        this.prevSortedBindings = this.sortedBindings;
      }
      this.masks = computeMasks(this.sortedBindings);
    }

    this.prevActiveSets.clear();
    for (const item of this.activeSets) {
      this.prevActiveSets.add(item);
    }
    resolveActionSets();
    for (const { set, value } of this.pendingSetChanges) {
      this.activeSets[value ? "add" : "delete"](set);
    }
    const activeSetsChanged =
      this.prevActiveSets.size !== this.activeSets.size ||
      intersection(this.prevActiveSets, this.activeSets).size !== this.activeSets.size;
    this.pendingSetChanges.length = 0;
    if (registeredMappingsChanged || activeSetsChanged || (!this.actives && !this.masked)) {
      this.prevActives = this.actives;
      this.prevMasked = this.masked;
      const { actives, masked } = computeExecutionStrategy(this.sortedBindings, this.masks, this.activeSets);
      this.actives = actives;
      this.masked = masked;
    }

    this.frame = {};
    for (const device of this.activeDevices) {
      device.write(this.frame);
    }

    for (const i in this.sortedBindings) {
      if (!this.actives[i] || this.masked[i].length > 0) continue;

      const binding = this.sortedBindings[i];

      let bindingExistedLastFrame = true;
      if (!registeredMappingsChanged && activeSetsChanged && this.prevSortedBindings) {
        const j = this.prevSortedBindings.indexOf(binding);
        bindingExistedLastFrame = j > -1 && this.prevActives[j] && this.prevMasked[j].length === 0;
      }
      if (!bindingExistedLastFrame) {
        this.xformStates.delete(binding);
      }

      const { src, dest, xform } = binding;
      const newState = xform(this.frame, src, dest, this.xformStates.get(binding));
      if (newState !== undefined) {
        this.xformStates.set(binding, newState);
      }
    }

    this.prevSortedBindings = this.sortedBindings;
    this.prevFrame = this.frame;
  }
});
