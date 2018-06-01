/**
 * Hides entities based on the scene's quality mode
 * @namespace environment
 * @component hide-when-quality
 */
AFRAME.registerComponent("hide-when-quality", {
  schema: { type: "string", default: "low" },

  init() {
    this.onQualityChanged = this.onQualityChanged.bind(this);
    this.el.sceneEl.addEventListener("quality-changed", this.onQualityChanged);
  },

  onQualityChanged(event) {
    this.updateComponentState(event.detail);
  },

  update(oldData) {
    if (this.data !== oldData) {
      this.updateComponentState(window.APP.quality);
    }
  },

  updateComponentState(quality) {
    this.el.setAttribute("visible", quality !== this.data);
  }
});
