import { proxiedUrlFor, resolveUrl, fetchMaxContentIndex } from "../utils/media-utils";

AFRAME.registerComponent("media-pager", {
  schema: {
    src: { type: "string" },
    resolve: { type: "boolean", default: true },
    index: { default: 0 }
  },

  init() {
    this.onImageLoaded = this.onImageLoaded.bind(this);
    this.onNext = this.onNext.bind(this);
    this.onPrev = this.onPrev.bind(this);

    this.toolbar = null;
    this.el.addEventListener("image-loaded", this.onImageLoaded);
    // Only used for caching the error texture.
    this.textureCache = this.el.sceneEl.systems["texture-cache"].cache;
    this.maxIndex = 0;
  },

  async onImageLoaded(e) {
    // unfortunately, since we loaded the page image in an img tag inside media-image, we have to make a second
    // request for the same page to read out the max-content-index header
    this.maxIndex = await fetchMaxContentIndex(e.detail.src);
    // if this is the first image we ever loaded, set up the UI
    if (this.toolbar == null) {
      const template = document.getElementById("paging-toolbar");
      this.el.querySelector(".interactable-ui").appendChild(document.importNode(template.content, true));
      this.toolbar = this.el.querySelector(".paging-toolbar");
      // we have to wait a tick for the attach callbacks to get fired for the elements in a template
      setTimeout(() => {
        this.nextButton = this.el.querySelector(".next-button [text-button]");
        this.prevButton = this.el.querySelector(".prev-button [text-button]");
        this.pageLabel = this.el.querySelector(".page-label");

        this.nextButton.addEventListener("grab-start", this.onNext);
        this.prevButton.addEventListener("grab-start", this.onPrev);

        this.repositionToolbar();
        this.el.emit("preview-loaded");
      }, 0);
    } else {
      this.repositionToolbar();
    }
  },

  async setPage(src, index) {
    try {
      if (src === "error") {
        this.el.setAttribute("media-image", { src, resolve: false, contentType: "image/png" });
        return;
      }

      if (this.pageLabel) {
        this.pageLabel.setAttribute("text", "value", `${index + 1}/${this.maxIndex + 1}`);
      }

      // Show the loading indicator while we are resolving the url.
      this.el.setAttribute("loading-indicator", "");
      this.el.setAttribute("shape", {
        shape: "box",
        halfExtents: { x: 1, y: 1, z: 1 }
      });

      if (this.toolbar) {
        this.repositionToolbar();
      }

      let accessibleUrl = src;

      // Resolve the pdf url from the media API
      if (this.data.resolve) {
        const result = await resolveUrl(src);
        const canonicalUrl = result.origin;
        accessibleUrl = proxiedUrlFor(canonicalUrl, index);
      }

      this.el.setAttribute("media-image", { src: accessibleUrl, resolve: false });
    } catch (e) {
      this.el.setAttribute("media-image", { src: "error" });
      throw e;
    }
  },

  update(oldData) {
    const { src, index } = this.data;

    if (src === oldData.src && index === oldData.index) {
      return;
    }

    this.setPage(src, index).catch(e => {
      console.error("Error loading pdf", src, e);
    });
  },

  remove() {
    if (this.toolbar) {
      this.toolbar.parentNode.removeChild(this.toolbar);
    }
  },

  onNext() {
    this.el.setAttribute("media-pager", "index", Math.min(this.data.index + 1, this.maxIndex));
    this.el.emit("pager-page-changed");
  },

  onPrev() {
    this.el.setAttribute("media-pager", "index", Math.max(this.data.index - 1, 0));
    this.el.emit("pager-page-changed");
  },

  repositionToolbar() {
    this.toolbar.object3D.position.y = -this.el.getAttribute("shape").halfExtents.y - 0.2;
  }
});
