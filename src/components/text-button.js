/**
 * A button with text and haptics
 * @namespace ui
 * @component text-button
 */
AFRAME.registerComponent("text-button", {
  schema: {
    haptic: { type: "selector" },
    textHoverColor: { type: "string" },
    textColor: { type: "string" },
    backgroundHoverColor: { type: "string" },
    backgroundColor: { type: "string" }
  },

  init() {
    this.onHover = () => {
      this.hovering = true;
      this.updateButtonState();
      this.emitHapticPulse();
    };
    this.onHoverOut = () => {
      this.hovering = false;
      this.updateButtonState();
    };
    this.onClick = () => {
      this.emitHapticPulse();
    };
    this.textEl = this.el.parentEl.querySelector("[text]");
  },

  emitHapticPulse() {
    if (this.data.haptic) {
      this.data.haptic.emit("haptic_pulse", { intensity: "low" });
    }
  },

  play() {
    this.updateButtonState();
    this.el.addEventListener("mouseover", this.onHover);
    this.el.addEventListener("mouseout", this.onHoverOut);
    this.el.addEventListener("grab-start", this.onClick);
  },

  pause() {
    this.el.removeEventListener("mouseover", this.onHover);
    this.el.removeEventListener("mouseout", this.onHoverOut);
    this.el.removeEventListener("grab-start", this.onClick);
  },

  update() {
    this.updateButtonState();
  },

  updateButtonState() {
    const hovering = this.hovering;
    this.el.setAttribute("slice9", "color", hovering ? this.data.backgroundHoverColor : this.data.backgroundColor);
    this.textEl.setAttribute("text", "color", hovering ? this.data.textHoverColor : this.data.textColor);
  }
});

const noop = function() {};
// TODO: this should ideally be fixed upstream somehow but its pretty tricky since text is just a geometry not a different type of Object3D, and Object3D is what handles raycast checks.
AFRAME.registerComponent("text-raycast-hack", {
  dependencies: ["text"],
  init() {
    this.el.getObject3D("text").raycast = noop;
  }
});
