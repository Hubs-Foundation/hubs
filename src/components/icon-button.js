/**
 * A button with an image, tooltip, hover states and haptics.
 * @namespace ui
 * @component icon-button
 */
AFRAME.registerComponent("icon-button", {
  schema: {
    image: { type: "string" },
    hoverImage: { type: "string" },
    activeImage: { type: "string" },
    activeHoverImage: { type: "string" },
    active: { type: "boolean" },
    haptic: { type: "selector" },
    tooltip: { type: "selector" },
    tooltipText: { type: "string" },
    activeTooltipText: { type: "string" }
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
  },

  emitHapticPulse() {
    if (this.data.haptic) {
      this.data.haptic.emit("haptic_pulse", { intensity: "low" });
    }
  },

  play() {
    this.updateButtonState();
    this.el.addEventListener("hover-start", this.onHover);
    this.el.addEventListener("hover-end", this.onHoverOut);
    this.el.addEventListener("grab-start", this.onClick);
  },

  pause() {
    this.el.removeEventListener("hover-start", this.onHover);
    this.el.removeEventListener("hover-end", this.onHoverOut);
    this.el.removeEventListener("grab-start", this.onClick);
  },

  update() {
    this.updateButtonState();
  },

  updateButtonState() {
    const hovering = this.hovering;
    const active = this.data.active;

    const image = active ? (hovering ? "activeHoverImage" : "activeImage") : hovering ? "hoverImage" : "image";

    this.el.setAttribute("src", this.data[image]);

    if (this.data.tooltip) {
      this.data.tooltip.setAttribute("visible", this.hovering);
      this.data.tooltip
        .querySelector("[text]")
        .setAttribute("text", "value", this.data.active ? this.data.activeTooltipText : this.data.tooltipText);
    }
  }
});
