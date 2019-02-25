/* global AFRAME, console */

export const AppModes = Object.freeze({ DEFAULT: "default", HUD: "hud" });

/**
 * Simple system for keeping track of a modal app state
 * @system app-mode
 */
AFRAME.registerSystem("app-mode", {
  init() {
    this.setMode(AppModes.DEFAULT);
  },

  setMode(newMode) {
    if (Object.values(AppModes).includes(newMode) && newMode !== this.mode) {
      this.mode = newMode;
      this.el.emit("app-mode-change", { mode: this.mode });
    }
  }
});

/**
 * Toggle the isPlaying state of a component based on app mode
 * @namespace app-mode
 * @component app-mode-toggle-playing
 */
AFRAME.registerComponent("app-mode-toggle-playing", {
  multiple: true,
  schema: {
    mode: { type: "string" },
    invert: { type: "boolean", default: false }
  },

  init() {
    const AppModeSystem = this.el.sceneEl.systems["app-mode"];
    this.el.sceneEl.addEventListener("app-mode-change", e => {
      this.updateComponentState(e.detail.mode === this.data.mode);
    });
    this.updateComponentState(AppModeSystem.mode === this.data.mode);
  },

  updateComponentState(isModeActive) {
    const componentName = this.id;
    this.el.components[componentName][isModeActive !== this.data.invert ? "play" : "pause"]();
  }
});

/**
 * Toggle a boolean property of a component based on app mode
 * @namespace app-mode
 * @component app-mode-toggle-attribute
 */
AFRAME.registerComponent("app-mode-toggle-attribute", {
  multiple: true,
  schema: {
    mode: { type: "string" },
    invert: { type: "boolean", default: false },
    property: { type: "string" }
  },

  init() {
    const AppModeSystem = this.el.sceneEl.systems["app-mode"];
    this.el.sceneEl.addEventListener("app-mode-change", e => {
      this.updateComponentState(e.detail.mode === this.data.mode);
    });
    this.updateComponentState(AppModeSystem.mode === this.data.mode);
  },

  updateComponentState(isModeActive) {
    const componentName = this.id;
    this.el.setAttribute(componentName, this.data.property, isModeActive !== this.data.invert);
  }
});

/**
 * Toggle aframe input mappings action set based on app mode
 * @namespace app-mode
 * @component app-mode-input-mappings
 */
AFRAME.registerComponent("app-mode-input-mappings", {
  schema: {
    modes: { default: [] },
    actionSets: { default: [] }
  },
  init() {
    this.el.sceneEl.addEventListener("app-mode-change", e => {
      const { modes, actionSets } = this.data;
      const idx = modes.indexOf(e.detail.mode);
      if (idx != -1 && modes[idx] && actionSets[idx] && AFRAME.inputActions[actionSets[idx]]) {
        // TODO: this assumes full control over current action set reguardless of what else might be manipulating it, this is obviously wrong
        AFRAME.currentInputMapping = actionSets[idx];
      } else {
        console.error(`no valid action set for ${e.detail.mode}`);
      }
    });
  }
});

/**
 * Toggle visibility of an entity based on if the user is in vr mode or not
 * @namespace vr-mode
 * @component vr-mode-toggle-visibility
 */
AFRAME.registerComponent("vr-mode-toggle-visibility", {
  schema: {
    invert: { type: "boolean", default: false }
  },

  init() {
    this.updateComponentState = this.updateComponentState.bind(this);
  },

  play() {
    this.updateComponentState();
    this.el.sceneEl.addEventListener("enter-vr", this.updateComponentState);
    this.el.sceneEl.addEventListener("exit-vr", this.updateComponentState);
  },

  pause() {
    this.el.sceneEl.removeEventListener("enter-vr", this.updateComponentState);
    this.el.sceneEl.removeEventListener("exit-vr", this.updateComponentState);
  },

  updateComponentState() {
    const inVRMode = this.el.sceneEl.is("vr-mode");
    this.el.setAttribute("visible", inVRMode !== this.data.invert);
  }
});

/**
 * Toggle the isPlaying state of a component based on app mode
 * @namespace vr-mode
 * @component vr-mode-toggle-playing
 */
AFRAME.registerComponent("vr-mode-toggle-playing", {
  multiple: true,
  schema: {
    invert: { type: "boolean", default: false }
  },

  init() {
    this.updateComponentState = this.updateComponentState.bind(this);
  },

  play() {
    this.updateComponentState();
    this.el.sceneEl.addEventListener("enter-vr", this.updateComponentState);
    this.el.sceneEl.addEventListener("exit-vr", this.updateComponentState);
  },

  pause() {
    this.el.sceneEl.removeEventListener("enter-vr", this.updateComponentState);
    this.el.sceneEl.removeEventListener("exit-vr", this.updateComponentState);
  },

  updateComponentState() {
    const componentName = this.id;
    const inVRMode = this.el.sceneEl.is("vr-mode");
    this.el.components[componentName][inVRMode !== this.data.invert ? "play" : "pause"]();
  }
});

/**
 * Toggle a CSS class based upon app mode.
 * @namespace vr-mode
 * @component vr-mode-toggle-class
 */
AFRAME.registerComponent("vr-mode-toggle-class", {
  multiple: true,
  schema: {
    invert: { type: "boolean", default: false },
    class: { type: "string", default: false }
  },

  init() {
    this.updateComponentState = this.updateComponentState.bind(this);
  },

  play() {
    this.updateComponentState();
    this.el.sceneEl.addEventListener("enter-vr", this.updateComponentState);
    this.el.sceneEl.addEventListener("exit-vr", this.updateComponentState);
  },

  pause() {
    this.el.sceneEl.removeEventListener("enter-vr", this.updateComponentState);
    this.el.sceneEl.removeEventListener("exit-vr", this.updateComponentState);
  },

  updateComponentState() {
    const inVRMode = this.el.sceneEl.is("vr-mode");

    if (inVRMode) {
      this.el.classList.add(this.data.class);
    } else {
      this.el.classList.remove(this.data.class);
    }
  }
});
