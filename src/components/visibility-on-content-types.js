AFRAME.registerComponent("visibility-on-content-types", {
  schema: {
    contentTypes: { type: "string" }, // Space separate content types. Or partial type, like video/
    contentSubtype: { type: "string" },
    visible: { type: "boolean", default: true }
  },

  init() {
    this.updateVisibility = this.updateVisibility.bind(this);

    NAF.utils
      .getNetworkedEntity(this.el)
      .then(el => {
        this.networkedEl = el;
        el.addEventListener("media_resolved", ({ detail: { contentType } }) => this.updateVisibility(contentType));
        this.updateVisibility();
      })
      .catch(() => {
        // Non-networked, do not handle for now.
      });
  },

  updateVisibility(contentType) {
    const mediaLoader = this.networkedEl.components["media-loader"];
    const mediaImage = this.networkedEl.components["media-image"];
    const mediaVideo = this.networkedEl.components["media-video"];
    const mediaPdf = this.networkedEl.components["media-pdf"];
    const currentContentType =
      contentType ||
      (mediaVideo && mediaVideo.data.contentType) ||
      (mediaImage && mediaImage.data.contentType) ||
      (mediaPdf && mediaPdf.data.contentType);

    let matchesType = !this.data.contentTypes;

    if (this.data.contentTypes && currentContentType) {
      for (const contentType of this.data.contentTypes.split(" ")) {
        const targetContentType = currentContentType.toLowerCase().split(";")[0];

        if (
          targetContentType === contentType ||
          (contentType.endsWith("/") && targetContentType.startsWith(contentType))
        ) {
          matchesType = true;
          break;
        }
      }
    }

    const matchesSubtype =
      !this.data.contentSubtype ||
      (mediaLoader.data.contentSubtype && mediaLoader.data.contentSubtype === this.data.contentSubtype);
    const matches = !!(matchesType && matchesSubtype);
    this.el.object3D.visible = this.data.visible ? matches : !matches;
  }
});
