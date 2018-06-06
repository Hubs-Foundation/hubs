/**
 * Toggles the visibility of this entity when the scene is frozen.
 * @namespace ui
 * @component visible-while-frozen
 */
AFRAME.registerComponent("visible-while-frozen", {
  init() {
    this.onStateChange = evt => {
      if (!evt.detail === "frozen") return;
      this.el.setAttribute("visible", this.el.sceneEl.is("frozen"));
    };
    this.el.setAttribute("visible", this.el.sceneEl.is("frozen"));
  },

  play() {
    this.el.sceneEl.addEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.addEventListener("stateremoved", this.onStateChange);
  },

  pause() {
    this.el.sceneEl.removeEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateChange);
  }
});

/**
 * Toggles the interactivity of a UI entity while the scene is frozen.
 * @namespace ui
 * @component ui-class-while-frozen
 */
AFRAME.registerComponent("ui-class-while-frozen", {
  init() {
    this.onStateChange = evt => {
      if (!evt.detail === "frozen") return;
      this.el.classList.toggle("ui", this.el.sceneEl.is("frozen"));
    };
    this.el.classList.toggle("ui", this.el.sceneEl.is("frozen"));
  },

  play() {
    this.el.sceneEl.addEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.addEventListener("stateremoved", this.onStateChange);
  },

  pause() {
    this.el.sceneEl.removeEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateChange);
  }
});
