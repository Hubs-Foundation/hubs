/* global AFRAME, console, setTimeout, clearTimeout */

const AppModes = Object.freeze({ DEFAULT: "default", HUD: "hud" });

/**
 * Simple system for keeping track of a modal app state
 */
AFRAME.registerSystem("app-mode", {
  init() {
    console.log("init app mode system");
    this.setMode(AppModes.DEFAULT);
  },

  setMode(newMode) {
    if (Object.values(AppModes).includes(newMode) && newMode !== this.mode) {
      this.mode = newMode;
      this.el.emit("appmode-change", { mode: this.mode });
    }
  }
});

/**
 * Toggle the isPlaying state of a component based on app mode
 */
AFRAME.registerComponent("mode-responder-toggle", {
  multiple: true,
  schema: {
    mode: { type: "string" },
    invert: { type: "boolean", default: false }
  },

  init() {
    const AppModeSystem = this.el.sceneEl.systems["app-mode"];
    this.el.sceneEl.addEventListener("appmode-change", e => {
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
 */
AFRAME.registerComponent("mode-responder-property-toggle", {
  multiple: true,
  schema: {
    mode: { type: "string" },
    invert: { type: "boolean", default: false },
    property: { type: "string" }
  },

  init() {
    const AppModeSystem = this.el.sceneEl.systems["app-mode"];
    this.el.sceneEl.addEventListener("appmode-change", e => {
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
 */
AFRAME.registerComponent("mode-responder-input-mappings", {
  schema: {
    modes: { default: [] },
    actionSets: { default: [] }
  },
  init() {
    this.el.sceneEl.addEventListener("appmode-change", e => {
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
 * Positions the HUD and toggles app mode based on where the user is looking
 */
AFRAME.registerComponent("hud-detector", {
  schema: {
    hud: { type: "selector" },
    offset: { default: 1 }, // distance from hud bellow head,
    lookCutoff: { default: -20 }, // angle at which the hud should be "on",
    animRange: { default: 30 } // degres over wich to animate the hud into view
  },
  init() {},

  tick() {
    const hud = this.data.hud.object3D;
    const head = this.el.object3D;

    const { offset, lookCutoff, animRange } = this.data;

    const headRot = head.rotation;
    const pitch = headRot.x * THREE.Math.RAD2DEG;

    // Reorient the hud only if the user is looking "up", for right now this arbitrarily means the hud is 1/3 way animated away
    // TODO: come up with better huristics for this that maybe account for the user turning away from the hud "too far", also animate the position so that it doesnt just snap.
    if (pitch > lookCutoff + animRange / 3) {
      const lookDir = new THREE.Vector3(0, 0, -1);
      lookDir.applyQuaternion(head.quaternion);
      lookDir.add(head.position);
      hud.position.x = lookDir.x;
      hud.position.z = lookDir.z;
      hud.setRotationFromEuler(new THREE.Euler(0, head.rotation.y, 0));
    }

    //animate the hud into place over animRange degres as the user aproaches the lookCutoff angle
    const t = 1 - THREE.Math.clamp(pitch - lookCutoff, 0, animRange) / animRange;
    hud.position.y = head.position.y - offset - offset * (1 - t);
    hud.rotation.x = (1 - t) * THREE.Math.DEG2RAD * 90;

    // update the app mode when the HUD locks on or off
    // TODO: this assumes full control over current app mode reguardless of what else might be manipulating it, this is obviously wrong
    const AppModeSystem = this.el.sceneEl.systems["app-mode"];
    if (pitch < lookCutoff && AppModeSystem.mode !== AppModes.HUD) {
      AppModeSystem.setMode(AppModes.HUD);
    } else if (pitch > lookCutoff && AppModeSystem.mode === AppModes.HUD) {
      AppModeSystem.setMode(AppModes.DEFAULT);
    }
  }
});
