// For use in environment gltf bundles to set scene shadow properties.
AFRAME.registerComponent("scene-shadow", {
  schema: {
    autoUpdate: {
      type: "boolean",
      default: true
    },
    type: {
      type: "string",
      default: "pcf"
    },
    renderReverseSided: {
      type: "boolean",
      default: true
    },
    renderSingleSided: {
      type: "boolean",
      default: true
    }
  },
  init() {
    this.originalShadowProperties = this.el.sceneEl.getAttribute("shadow");
  },
  update() {
    this.el.sceneEl.setAttribute("shadow", this.data);
  },
  remove() {
    this.el.sceneEl.setAttribute("shadow", this.originalShadowProperties);
  }
});
