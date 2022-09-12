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
    class: { type: "string", default: "" }
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
