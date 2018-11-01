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

function buildMap(registeredMappings) {
  const map = new Map();
  const add = (path, binding) => {
    if (!map.has(path)) {
      map.set(path, [binding]);
    } else {
      map.get(path).push(binding);
    }
  };
  for (const mapping of registeredMappings) {
    for (const setName in mapping) {
      for (const binding of mapping[setName]) {
        if (Array.isArray(binding.src)) {
          for (const path of binding.src) {
            add(path, binding);
          }
        } else {
          for (const srcKey in binding.src) {
            const path = binding.src[srcKey];
            add(path, binding);
          }
        }
      }
    }
  }
  return map;
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

    this.activeSets = new Set([sets.global]);
    this.pendingSetChanges = [];
    this.activeDevices = new Set([new MouseDevice(), new AppAwareMouseDevice(), new KeyboardDevice(), new HudDevice()]);

    this.registeredMappings = new Set([keyboardDebuggingBindings]);
    this.map = buildMap(this.registeredMappings);
    this.xformStates = new Map();

    const appAwareTouchscreenDevice = new AppAwareTouchscreenDevice();
    const updateBindingsForVRMode = () => {
      const inVRMode = this.el.sceneEl.is("vr-mode");
      if (AFRAME.utils.device.isMobile()) {
        if (inVRMode) {
          this.activeDevices.delete(appAwareTouchscreenDevice);
          this.registeredMappings.delete(touchscreenUserBindings);
        } else {
          this.activeDevices.add(appAwareTouchscreenDevice);
          this.registeredMappings.add(touchscreenUserBindings);
        }
      } else {
        if (inVRMode) {
          this.registeredMappings.delete(keyboardMouseUserBindings);
        } else {
          this.registeredMappings.add(keyboardMouseUserBindings);
        }
      }
      this.map = buildMap(this.registeredMappings);
    };
    this.el.sceneEl.addEventListener("enter-vr", updateBindingsForVRMode);
    this.el.sceneEl.addEventListener("exit-vr", updateBindingsForVRMode);
    updateBindingsForVRMode();

    window.addEventListener(
      "gamepadconnected",
      e => {
        let gamepadDevice;
        for (let i = 0; i < this.activeDevices.length; i++) {
          const activeDevice = this.activeDevices[i];
          if (activeDevice.gamepad && activeDevice.gamepad === e.gamepad) {
            console.warn("ignoring gamepad", e.gamepad);
            return; // multiple connect events without a disconnect event
          }
        }
        if (e.gamepad.id === "OpenVR Gamepad") {
          gamepadDevice = new ViveControllerDevice(e.gamepad);
          this.registeredMappings.add(viveUserBindings);
        } else if (e.gamepad.id.startsWith("Oculus Touch")) {
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
        this.map = buildMap(this.registeredMappings);
      },
      false
    );
    window.addEventListener(
      "gamepaddisconnected",
      e => {
        for (const device of this.activeDevices) {
          if (device.gamepad === e.gamepad) {
            this.activeDevices.delete(device);
            this.map = buildMap(this.registeredMappings);
            return;
          }
        }
      },
      false
    );
  },

  tick() {
    resolveActionSets();

    for (const { set, value } of this.pendingSetChanges) {
      this.activeSets[value ? "add" : "delete"](set);
    }
    const runners = this.pendingSetChanges.length ? [] : this.runners;
    if (this.pendingSetChanges.length) {
      this.pendingSetChanges.length = 0;
      this.actives = [];
      for (const mapping of this.registeredMappings) {
        for (const setName in mapping) {
          if (!this.activeSets.has(setName) || !mapping[setName]) continue;
          for (const binding of mapping[setName]) {
            let active = false;
            for (const set of binding.sets) {
              if (this.activeSets.has(set)) {
                active = true;
              }
            }
            this.actives.push(active);
            runners.push(binding);
          }
        }
      }

      const maxAmongActive = (path, map) => {
        let max = -1;
        const bindings = map.get(path);
        if (!bindings) {
          return -1;
        }
        for (const binding of bindings) {
          let active = false;
          for (const set of binding.sets) {
            if (this.activeSets.has(set)) {
              active = true;
            }
          }
          if (active && binding.priority && binding.priority > max) {
            max = binding.priority;
          }
        }
        return max;
      };

      for (const i in runners) {
        if (!this.actives[i]) continue;
        const binding = runners[i];
        let active = true;
        for (const p in binding.src) {
          const path = binding.src[p];
          const subpaths = String.split(path, "/");
          while (subpaths.length > 1) {
            if ((binding.priority || 0) < maxAmongActive(Array.join(subpaths, "/"), this.map, this.activeSets)) {
              active = false;
            }
            subpaths.pop();
          }
        }
        this.actives[i] = active;
      }
    }

    this.frame = {};
    for (const device of this.activeDevices) {
      device.write(this.frame);
    }

    for (const i in runners) {
      const binding = runners[i];
      if (!this.actives[i]) continue;
      const bindingExistedLastFrame = this.runners && this.runners.includes(binding);
      if (!bindingExistedLastFrame) {
        this.xformStates.delete(binding);
      }

      const { src, dest, xform } = binding;
      const newState = xform(this.frame, src, dest, this.xformStates.get(binding));
      if (newState !== undefined) {
        this.xformStates.set(binding, newState);
      }
    }

    this.runners = runners;
  }
});
