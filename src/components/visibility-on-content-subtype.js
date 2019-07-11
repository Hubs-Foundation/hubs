AFRAME.registerComponent("visibility-on-content-subtype", {
  schema: {
    contentSubtype: { type: "string" },
    visible: { type: "boolean", default: true }
  },

  init() {
    NAF.utils.getNetworkedEntity(this.el).then(el => {
      if (el.components["media-loader"].data.contentSubtype === this.data.contentSubtype) {
        this.el.object3D.visible = this.data.visible;
      } else {
        this.el.object3D.visible = !this.data.visible;
      }
    });
  }
});
