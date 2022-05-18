/**
 * A button with text
 * @namespace ui
 * @component text-button
 */
AFRAME.registerComponent("text-button", {
  schema: {
    textHoverColor: { type: "string" },
    textColor: { type: "string" },
    backgroundHoverColor: { type: "string" },
    backgroundColor: { type: "string" }
  },

  init() {
    // TODO: This is a bit of a hack to deal with position "component" not setting matrixNeedsUpdate. Come up with a better solution.
    this.el.object3D.matrixNeedsUpdate = true;
    this.onHover = () => {
      this.hovering = true;
      this.updateButtonState();
    };
    this.onHoverOut = () => {
      this.hovering = false;
      this.updateButtonState();
    };
    this.textEl = this.el.querySelector("[text]");

    if (this.el.getObject3D("mesh")) {
      this.el.components.slice9.plane.material.toneMapped = false;
    } else {
      this.el.addEventListener(
        "object3dset",
        () => {
          this.el.components.slice9.plane.material.toneMapped = false;
        },
        { once: true }
      );
    }
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
    this.el.setAttribute("slice9", "color", hovering ? this.data.backgroundHoverColor : this.data.backgroundColor);

    if (this.textEl) {
      this.textEl.setAttribute("text", "color", hovering ? this.data.textHoverColor : this.data.textColor);
    }
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
