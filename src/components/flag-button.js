import { virtualAgent } from "../bit-systems/agent-system";
import { subtitleSystem } from "../bit-systems/subtitling-system";

/**
 * A button with an image, tooltip, hover states.
 * @namespace ui
 * @component flag-button
 */
AFRAME.registerComponent("flag-button", {
  schema: {
    active: { type: "boolean" },
    disabled: { type: "boolean" },
    tooltip: { type: "selector" },
    tooltipText: { type: "string" },
    activeTooltipText: { type: "string" }
  },

  init() {
    this.el.object3D.matrixNeedsUpdate = true;
    this.lang = null;
    this.onHover = () => {
      this.hovering = true;
      if (this.data.tooltip) {
        this.data.tooltip.object3D.visible = true;
      }
      this.updateButtonState();
    };
    this.onHoverOut = () => {
      this.hovering = false;
      if (this.data.tooltip) {
        this.data.tooltip.object3D.visible = false;
      }
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
    this.updateLangState();
    const hovering = this.hovering;
    const active = this.data.active;
    const disabled = this.data.disabled;

    let image;
    if (disabled) {
      image = "disabledImage";
    } else if (active) {
      image = hovering ? "_on-hover" : "_on";
    } else {
      image = hovering ? "_off-hover" : "_off";
    }

    if (this.el.components.sprite) {
      if (image) {
        const icon_name = this.lang ? `${this.lang}_lang${image}.png` : `translate${image}.png`;
        this.el.setAttribute("sprite", "name", icon_name);
        console.log("icon name", icon_name);
      } else {
        console.warn(`No ${image} image on me.`, this);
      }
    } else {
      console.error("No sprite.");
    }

    if (this.data.tooltip && hovering) {
      const tooltipText =
        (this.data.active ? this.data.activeTooltipText : this.data.tooltipText) + (disabled ? " Disabled" : "");
      this.data.tooltip.querySelector("[text]").setAttribute("text", "value", tooltipText);
    }
  },
  updateLangState() {
    this.lang = subtitleSystem.targetLanguage;
    console.log("this lang:", this.lang);
  }
});
