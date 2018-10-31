import { paths } from "./paths";
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

const priorityMap = new Map();
function prioritizeBindings(registeredMappings, activeSets) {
  const activeBindings = new Set();
  priorityMap.clear();
  for (const mapping of registeredMappings) {
    for (const setName in mapping) {
      if (!activeSets.has(setName) || !mapping[setName]) continue;
      for (const binding of mapping[setName]) {
        const { root, priority } = binding;
        const prevBinding = priorityMap.get(root);
        if (!root || !priority) {
          activeBindings.add(binding);
        } else if (!prevBinding) {
          activeBindings.add(binding);
          priorityMap.set(root, binding);
        } else if (priority > prevBinding.priority) {
          activeBindings.delete(priorityMap.get(root));
          activeBindings.add(binding);
          priorityMap.set(root, binding);
        } else if (prevBinding.priority === priority) {
          console.error("equal priorities on same root", binding, priorityMap.get(root));
        }
      }
    }
  }
  return activeBindings;
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
      },
      false
    );
    window.addEventListener(
      "gamepaddisconnected",
      e => {
        for (const device of this.activeDevices) {
          if (device.gamepad === e.gamepad) {
            this.activeDevices.delete(device);
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
    this.pendingSetChanges.length = 0;

    this.frame = {};
    for (const device of this.activeDevices) {
      device.write(this.frame);
    }

    const activeBindings = prioritizeBindings(this.registeredMappings, this.activeSets);
    for (const binding of activeBindings) {
      const bindingExistedLastFrame = this.activeBindings && this.activeBindings.has(binding);
      if (!bindingExistedLastFrame) {
        this.xformStates.delete(binding);
      }

      const { src, dest, xform } = binding;
      const newState = xform(this.frame, src, dest, this.xformStates.get(binding));
      if (newState !== undefined) {
        this.xformStates.set(binding, newState);
      }
    }

    this.activeBindings = activeBindings;

    if (this.frame[paths.actions.logDebugFrame] || this.frame[paths.actions.log]) {
      console.log("frame", this.frame);
      console.log("sets", this.activeSets);
      console.log("bindings", this.activeBindings);
      console.log("devices", this.activeDevices);
      console.log("xformStates", this.xformStates);
    }
  }
});
