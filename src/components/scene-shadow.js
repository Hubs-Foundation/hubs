/**
 * For use in environment gltf bundles to set scene shadow properties.
 * @namespace environment
 * @component scene-shadow
 */
AFRAME.registerComponent("scene-shadow", {
  schema: {
    type: {
      type: "string",
      default: "pcf"
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
