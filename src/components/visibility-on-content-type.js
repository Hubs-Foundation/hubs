AFRAME.registerComponent("visibility-on-content-type", {
  schema: {
    contentType: { type: "string" },
    contentSubtype: { type: "string" },
    visible: { type: "boolean", default: true }
  },

  init() {
    this.updateVisibility = this.updateVisibility.bind(this);

    NAF.utils.getNetworkedEntity(this.el).then(el => {
      this.networkedEl = el;
      el.addEventListener("media_resolved", ({ detail: { contentType } }) => this.updateVisibility(contentType));
      this.updateVisibility();
    });
  },

  updateVisibility(contentType) {
    const mediaLoader = this.networkedEl.components["media-loader"];
    const mediaImage = this.networkedEl.components["media-image"];
    const mediaVideo = this.networkedEl.components["media-video"];
    const currentContentType =
      contentType || (mediaVideo && mediaVideo.data.contentType) || (mediaImage && mediaImage.data.contentType);
    const matchesType =
      !this.data.contentType ||
      (currentContentType && currentContentType.toLowerCase().split(";")[0] === this.data.contentType);
    const matchesSubtype =
      !this.data.contentSubtype ||
      (mediaLoader.data.contentSubtype && mediaLoader.data.contentSubtype === this.data.contentSubtype);
    const matches = !!(matchesType && matchesSubtype);
    this.el.object3D.visible = this.data.visible ? matches : !matches;
  }
});
