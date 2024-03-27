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

    this.debugingUpdate = this.debugingUpdate.bind(this);
    this.onLanguageUpdate = this.onLanguageUpdate.bind(this);

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
    this.el.object3D.addEventListener("hovered", this.onHover);
    this.el.object3D.addEventListener("unhovered", this.onHoverOut);
    this.el.sceneEl.addEventListener("language_updated", this.onLanguageUpdate);
    this.updateButtonState();
  },

  pause() {
    this.el.object3D.removeEventListener("hovered", this.onHover);
    this.el.object3D.removeEventListener("unhovered", this.onHoverOut);
    this.el.sceneEl.removeEventListener("language_updated", this.onLanguageUpdate);
  },

  update() {
    this.updateButtonState();
  },

  debugingUpdate() {
    this.updateButtonState();
  },

  onLanguageUpdate(event) {
    this.lang = event.detail.language;
    this.updateButtonState();
  },

  updateButtonState() {
    const hovering = this.hovering;
    const active = this.data.active;
    const disabled = this.data.disabled;

    let image;
    if (disabled) {
      image = "-disabled";
    } else if (active) {
      image = hovering ? "_on-hover" : "_on";
    } else {
      image = hovering ? "_off-hover" : "_off";
    }

    if (this.el.components.sprite) {
      let icon_name;
      if (image) {
        icon_name = `${this.lang}${image}.png`;
        this.el.setAttribute("sprite", "name", icon_name);
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
  }
});
