/**
 * Hides entities based on the scene's quality mode
 * @namespace environment
 * @component hide-when-quality
 */
AFRAME.registerComponent("hide-when-quality", {
  schema: { type: "string", default: "low" },

  update(oldData) {
    if (this.data !== oldData) {
      this.updateComponentState(window.APP.store.materialQualitySetting);
    }
  },

  updateComponentState(quality) {
    this.el.setAttribute("visible", quality !== this.data);
  }
});
