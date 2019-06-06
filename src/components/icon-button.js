/**
 * A button with an image, tooltip, hover states.
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
    tooltip: { type: "selector" },
    tooltipText: { type: "string" },
    activeTooltipText: { type: "string" }
  },

  init() {
    this.el.object3D.matrixNeedsUpdate = true;
    this.onHover = () => {
      this.hovering = true;
      this.updateButtonState();
    };
    this.onHoverOut = () => {
      this.hovering = false;
      this.updateButtonState();
    };
  },

  play() {
    this.updateButtonState();
    this.el.object3D.addEventListener("hovered", this.onHover);
    this.el.object3D.addEventListener("unhovered", this.onHoverOut);
  },

  pause() {
    this.el.object3D.removeEventListener("hovered", this.onHover);
    this.el.object3D.removeEventListener("unhovered", this.onHoverOut);
  },

  update() {
    this.updateButtonState();
  },

  updateButtonState() {
    const hovering = this.hovering;
    const active = this.data.active;

    const image = active ? (hovering ? "activeHoverImage" : "activeImage") : hovering ? "hoverImage" : "image";

    if (this.el.components.sprite) {
      if (this.data[image]) {
        this.el.setAttribute("sprite", "name", this.data[image]);
      } else {
        console.warn(`No ${image} image on me.`, this);
      }
    } else {
      console.error("No sprite.");
    }

    if (this.data.tooltip && hovering) {
      this.data.tooltip.setAttribute("visible", this.hovering);
      this.data.tooltip
        .querySelector("[text]")
        .setAttribute("text", "value", this.data.active ? this.data.activeTooltipText : this.data.tooltipText);
    }
  }
});
