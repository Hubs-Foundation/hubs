import { sets } from "./sets";
import { paths } from "./paths";

import { MouseDevice } from "./devices/mouse";
import { KeyboardDevice } from "./devices/keyboard";
import { HudDevice } from "./devices/hud";
import { XboxControllerDevice } from "./devices/xbox-controller";
import { OculusGoControllerDevice } from "./devices/oculus-go-controller";
import { GearVRControllerDevice } from "./devices/gear-vr-controller";
import { OculusTouchControllerDevice } from "./devices/oculus-touch-controller";
import { DaydreamControllerDevice } from "./devices/daydream-controller";
import { ViveControllerDevice } from "./devices/vive-controller";
import { WindowsMixedRealityControllerDevice } from "./devices/windows-mixed-reality-controller";
import { GyroDevice } from "./devices/gyro";

import { AppAwareMouseDevice } from "./devices/app-aware-mouse";
import { AppAwareTouchscreenDevice } from "./devices/app-aware-touchscreen";

import { keyboardMouseUserBindings } from "./bindings/keyboard-mouse-user";
import { touchscreenUserBindings } from "./bindings/touchscreen-user";
import { keyboardDebuggingBindings } from "./bindings/keyboard-debugging";
import { oculusTouchUserBindings } from "./bindings/oculus-touch-user";
import { viveUserBindings } from "./bindings/vive-user";
import { wmrUserBindings } from "./bindings/windows-mixed-reality-user";
import { xboxControllerUserBindings } from "./bindings/xbox-controller-user";
import { daydreamUserBindings } from "./bindings/daydream-user";
import { cardboardUserBindings } from "./bindings/cardboard-user";

import generate3DOFTriggerBindings from "./bindings/oculus-go-user";
const oculusGoUserBindings = generate3DOFTriggerBindings(paths.device.oculusgo);
const gearVRControllerUserBindings = generate3DOFTriggerBindings(paths.device.gearVRController);

import { resolveActionSets } from "./resolve-action-sets";
import { GamepadDevice } from "./devices/gamepad";
import { gamepadBindings } from "./bindings/generic-gamepad";
import { detectInHMD, getAvailableVREntryTypes, VR_DEVICE_AVAILABILITY } from "../../utils/vr-caps-detect";
import { ArrayBackedSet, countIntersectionsForArrayBackedSets } from "./array-backed-set";

const copyAToB = (a, b) => {
  for (let i = 0; i < a.length; i++) {
    b[i] = a[i];
  }
  b.length = a.length;
};

const satisfiesPath = (binding, path) => {
  for (const key in binding.dest) {
    if (binding.dest[key].indexOf(path) !== -1) {
      return true;
    }
  }
  return false;
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

const dependencySort = (function() {
  const unsorted = [];
  return function dependencySort(mappings, sorted) {
    sorted.length = 0;
    unsorted.length = 0;

    for (const mapping of mappings) {
      for (const setName in mapping) {
        for (const binding of mapping[setName]) {
          unsorted.push(binding);
        }
      }
    }

    while (unsorted.length > 0) {
      const binding = unsorted.shift();
      if (satisfiedBy(binding, sorted)) {
        sorted.push(binding);
      } else {
        unsorted.push(binding);
      }
    }

    return sorted;
  };
})();

function canMask(masker, masked) {
  if (masker.priority === undefined) {
    masker.priority = 0;
  }
  if (masked.priority === undefined) {
    masked.priority = 0;
  }
  if (masked.priority >= masker.priority) return false;
  for (const maskerKey in masker.src) {
    const maskerPath = masker.src[maskerKey];
    for (const maskedKey in masked.src) {
      const maskedPath = masked.src[maskedKey];
      if (maskedPath.indexOf(maskerPath) !== -1) {
        return true;
      }
    }
  }
  return false;
}

function computeMasks(bindings, masks) {
  for (let row = 0; row < bindings.length; row++) {
    for (let col = 0; col < bindings.length; col++) {
      masks[row] = masks[row] || [];
      if (canMask(bindings[col], bindings[row])) {
        masks[row].push(col);
      }
    }
  }
}

function isActive(binding, sets) {
  for (let i = 0; i < binding.sets.length; i++) {
    if (sets.has(binding.sets[i])) {
      return true;
    }
  }
  return false;
}

function computeExecutionStrategy(sortedBindings, masks, activeSets, actives, masked) {
  actives.length = 0;
  for (let row = 0; row < sortedBindings.length; row++) {
    actives[row] = isActive(sortedBindings[row], activeSets);
  }

  for (let i = 0; i < masked.length; i++) {
    masked[i].length = 0;
  }
  masked.length = sortedBindings.length;

  for (let row = 0; row < sortedBindings.length; row++) {
    for (let col = 0; col < sortedBindings.length; col++) {
      masked[row] = masked[row] || [];
      if (masks[row].indexOf(col) !== -1 && isActive(sortedBindings[col], activeSets)) {
        masked[row].push(col);
      }
    }
  }
}

AFRAME.registerSystem("userinput", {
  get(path) {
    if (!this.frame) return undefined;
    return this.frame.get(path);
  },

  toggleSet(set, value) {
    this.pendingSetChanges.push({ set, value });
  },

  init() {
    this.frame = {
      generation: 0,
      values: {},
      generations: {},
      get: function(path) {
        if (this.generations[path] !== this.generation) return undefined;
        return this.values[path];
      },
      setValueType: function(path, value) {
        this.values[path] = value;
        this.generations[path] = this.generation;
      },
      setVector2: function(path, a, b) {
        const value = this.values[path] || [];
        value[0] = a;
        value[1] = b;
        this.values[path] = value;
        this.generations[path] = this.generation;
      },
      setPose: function(path, pose) {
        this.setValueType(path, pose);
      },
      setMatrix4: function(path, mat4) {
        // Should we assume the incoming mat4 is safe to store instead of copying values?
        const value = this.values[path] || new THREE.Matrix4();
        value.copy(mat4);
        this.values[path] = value;
        this.generations[path] = this.generation;
      }
    };

    this.activeSets = new ArrayBackedSet().add(sets.global);
    this.prevActiveSets = new ArrayBackedSet();
    this.pendingSetChanges = [];
    this.xformStates = new Map();
    this.activeDevices = new ArrayBackedSet().add(new HudDevice());
    this.prevActives = [];
    this.prevMasked = [];
    this.sortedBindings = [];
    this.prevSortedBindings = [];
    this.masks = [];

    if (!(AFRAME.utils.device.isMobile() || AFRAME.utils.device.isMobileVR())) {
      this.activeDevices.add(new MouseDevice());
      this.activeDevices.add(new AppAwareMouseDevice());
      this.activeDevices.add(new KeyboardDevice());
    } else if (!detectInHMD()) {
      this.activeDevices.add(new AppAwareTouchscreenDevice());
      this.activeDevices.add(new KeyboardDevice());
      this.activeDevices.add(new GyroDevice());
    }

    this.registeredMappings = new Set([keyboardDebuggingBindings]);
    this.registeredMappingsChanged = true;

    const vrGamepadMappings = new Map();
    vrGamepadMappings.set(WindowsMixedRealityControllerDevice, wmrUserBindings);
    vrGamepadMappings.set(ViveControllerDevice, viveUserBindings);
    vrGamepadMappings.set(OculusTouchControllerDevice, oculusTouchUserBindings);
    vrGamepadMappings.set(OculusGoControllerDevice, oculusGoUserBindings);
    vrGamepadMappings.set(GearVRControllerDevice, gearVRControllerUserBindings);
    vrGamepadMappings.set(DaydreamControllerDevice, daydreamUserBindings);

    const nonVRGamepadMappings = new Map();
    nonVRGamepadMappings.set(XboxControllerDevice, xboxControllerUserBindings);
    nonVRGamepadMappings.set(GamepadDevice, gamepadBindings);

    const updateBindingsForVRMode = () => {
      const inVRMode = this.el.sceneEl.is("vr-mode");
      const isMobile = AFRAME.utils.device.isMobile();

      if (inVRMode) {
        console.log("Using VR bindings.");
        this.registeredMappings.delete(isMobile ? touchscreenUserBindings : keyboardMouseUserBindings);
        // add mappings for all active VR input devices
        for (let i = 0; i < this.activeDevices.items.length; i++) {
          const activeDevice = this.activeDevices.items[i];
          const mapping = vrGamepadMappings.get(activeDevice.constructor);
          mapping && this.registeredMappings.add(mapping);
        }

        // Handle cardboard by looking of VR device caps
        if (isMobile) {
          getAvailableVREntryTypes().then(availableVREntryTypes => {
            if (availableVREntryTypes.cardboard === VR_DEVICE_AVAILABILITY.yes) {
              this.registeredMappings.add(cardboardUserBindings);
              this.registeredMappingsChanged = true;
            }
          });
        }
      } else {
        console.log("Using Non-VR bindings.");
        // remove mappings for all active VR input devices
        for (let i = 0; i < this.activeDevices.items.length; i++) {
          const activeDevice = this.activeDevices.items[i];
          this.registeredMappings.delete(vrGamepadMappings.get(activeDevice.constructor));
        }
        this.registeredMappings.add(isMobile ? touchscreenUserBindings : keyboardMouseUserBindings);
      }

      for (let i = 0; i < this.activeDevices.items.length; i++) {
        const activeDevice = this.activeDevices.items[i];
        const mapping = nonVRGamepadMappings.get(activeDevice.constructor);
        mapping && this.registeredMappings.add(mapping);
      }

      this.registeredMappingsChanged = true;
    };

    const gamepadConnected = e => {
      let gamepadDevice;
      for (let i = 0; i < this.activeDevices.items.length; i++) {
        const activeDevice = this.activeDevices.items[i];
        if (activeDevice.gamepad && activeDevice.gamepad.index === e.gamepad.index) {
          console.warn("connected already fired for gamepad", e.gamepad);
          return; // multiple connect events without a disconnect event
        }
      }
      if (e.gamepad.id === "OpenVR Gamepad") {
        gamepadDevice = new ViveControllerDevice(e.gamepad);
      } else if (e.gamepad.id.startsWith("Oculus Touch")) {
        gamepadDevice = new OculusTouchControllerDevice(e.gamepad);
      } else if (e.gamepad.id.startsWith("Spatial Controller")) {
        gamepadDevice = new WindowsMixedRealityControllerDevice(e.gamepad);
      } else if (e.gamepad.id === "Oculus Go Controller") {
        gamepadDevice = new OculusGoControllerDevice(e.gamepad);
        // Note that FXR reports Vive Focus' controller as GearVR, so this is primarily to support that
      } else if (e.gamepad.id === "Gear VR Controller") {
        gamepadDevice = new GearVRControllerDevice(e.gamepad);
      } else if (e.gamepad.id === "Daydream Controller") {
        gamepadDevice = new DaydreamControllerDevice(e.gamepad);
      } else if (e.gamepad.id.includes("Xbox")) {
        gamepadDevice = new XboxControllerDevice(e.gamepad);
      } else {
        gamepadDevice = new GamepadDevice(e.gamepad);
      }

      this.activeDevices.add(gamepadDevice);

      updateBindingsForVRMode();
    };

    const gamepadDisconnected = e => {
      let index = -1;
      for (let i = 0; i < this.activeDevices.items.length; i++) {
        const device = this.activeDevices.items[i];
        if (device.gamepad && device.gamepad.index === e.gamepad.index) {
          this.registeredMappings.delete(
            vrGamepadMappings.get(device.constructor) || nonVRGamepadMappings.get(device.constructor)
          );
          this.activeDevices.items[i] = this.activeDevices.items[this.activeDevices.items.length - 1];
          this.activeDevices.items.pop();
          return;
        }
      }

      updateBindingsForVRMode();
    };

    window.addEventListener("gamepadconnected", gamepadConnected, false);
    window.addEventListener("gamepaddisconnected", gamepadDisconnected, false);
    for (const gamepad of navigator.getGamepads()) {
      gamepad && gamepadConnected({ gamepad });
    }

    this.el.sceneEl.addEventListener("enter-vr", updateBindingsForVRMode);
    this.el.sceneEl.addEventListener("exit-vr", updateBindingsForVRMode);

    updateBindingsForVRMode();
  },

  tick() {
    this.frame.generation += 1;
    const registeredMappingsChanged = this.registeredMappingsChanged;
    if (registeredMappingsChanged) {
      this.registeredMappingsChanged = false;
      copyAToB(this.sortedBindings, this.prevSortedBindings);
      dependencySort(this.registeredMappings, this.sortedBindings);
      if (this.prevSortedBindings.length === 0) {
        // First time
        copyAToB(this.sortedBindings, this.prevSortedBindings);
      }
      computeMasks(this.sortedBindings, this.masks);
    }

    this.prevActiveSets.clear();
    for (let i = 0; i < this.activeSets.items.length; i++) {
      const set = this.activeSets.items[i];
      this.prevActiveSets.add(set);
    }
    resolveActionSets();
    for (let i = 0; i < this.pendingSetChanges.length; i++) {
      const { set, value } = this.pendingSetChanges[i];
      if (value) {
        this.activeSets.add(set);
      } else {
        this.activeSets.delete(set);
      }
    }
    const activeSetsChanged =
      this.prevActiveSets.items.length !== this.activeSets.items.length ||
      countIntersectionsForArrayBackedSets(this.prevActiveSets, this.activeSets) !== this.activeSets.items.length;
    this.pendingSetChanges.length = 0;
    if (!this.actives && !this.masked) {
      this.actives = [];
      this.masked = [];
      computeExecutionStrategy(this.sortedBindings, this.masks, this.activeSets, this.actives, this.masked);
    } else if (registeredMappingsChanged || activeSetsChanged) {
      copyAToB(this.actives, this.prevActives);
      copyAToB(this.masked, this.prevMasked);
      computeExecutionStrategy(this.sortedBindings, this.masks, this.activeSets, this.actives, this.masked);
    }

    for (let i = 0; i < this.activeDevices.items.length; i++) {
      this.activeDevices.items[i].write(this.frame);
    }

    for (let i = 0; i < this.sortedBindings.length; i++) {
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
  }
});
