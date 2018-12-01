import { objectTypeForOriginAndContentType } from "../object-types";
import {
  getOrientation,
  upload,
  guessContentType,
  fetchContentType,
  resolveUrl,
  proxiedUrlFor
} from "../utils/media-utils";

let interactableId = 0;

AFRAME.registerComponent("spawned-media", {
  schema: {
    src: { type: "string" },
    contentOrigin: { type: "string" },
    target: { type: "selector", default: "#player-camera" },
    offset: { type: "vec3" }
  },

  init() {
    this.onMediaLoaded = this.onMediaLoaded.bind(this);

    this.fireLoadingTimeout = null;
    this.orientation = null;
    this.contentType = null;
  },

  async spawnMedia(src) {
    try {
      if (!this.el.id) {
        this.el.id = "interactable-media-" + interactableId++;
      }

      this.el.setAttribute("offset-relative-to", {
        target: this.data.target,
        offset: this.data.offset
      });

      if (src === "error") {
        this.el.setAttribute("media-image", { src });
        return;
      }

      this.el.setAttribute("loading-indicator", "");

      this.fireLoadingTimeout = setTimeout(() => {
        this.el.sceneEl.emit("media-loading", { src: src });
      }, 100);

      this.orientation = await getOrientation(src);

      if (src instanceof File) {
        const response = await upload(src);
        const srcUrl = new URL(response.raw);
        srcUrl.searchParams.set("token", response.meta.access_token);
        this.el.emit("media-uploaded", { url: srcUrl.href });
        this.el.setAttribute("networked", { template: "#interactable-media-image" });
        this.el.setAttribute("media-image", { src: srcUrl.href });
        this.el.setAttribute("position-at-box-shape-border", { dirs: ["forward", "back"] });
        this.el.addEventListener("image-loaded", this.onMediaLoaded);
      } else if (src instanceof MediaStream) {
        this.el.setAttribute("networked", { template: "#interactable-media-video" });
        this.el.setAttribute("media-video", { src: `hubs://clients/${NAF.clientId}/video` });
        this.el.addEventListener("video-loaded", this.onMediaLoaded);
      } else {
        const result = await resolveUrl(src);
        const canonicalUrl = result.origin;
        const accessibleUrl = proxiedUrlFor(canonicalUrl);
        const contentType =
          (result.meta && result.meta.expected_content_type) ||
          guessContentType(canonicalUrl) ||
          (await fetchContentType(accessibleUrl));

        this.contentType = contentType;

        if (contentType.startsWith("video/") || contentType.startsWith("audio/")) {
          this.el.setAttribute("networked", { template: "#interactable-media-video" });
          this.el.setAttribute("media-video", { src: src });
          this.el.setAttribute("position-at-box-shape-border", { dirs: ["forward", "back"] });
          this.el.addEventListener("video-loaded", this.onMediaLoaded);
        } else if (contentType.startsWith("image/")) {
          this.el.setAttribute("networked", { template: "#interactable-media-image" });
          this.el.setAttribute("media-image", { src: src });
          this.el.setAttribute("position-at-box-shape-border", { dirs: ["forward", "back"] });
          this.el.addEventListener("image-loaded", this.onMediaLoaded);
        } else if (contentType.startsWith("application/pdf")) {
          this.el.setAttribute("networked", { template: "#interactable-media-pdf" });
          this.el.setAttribute("media-pager", { src: src });
          this.el.setAttribute("position-at-box-shape-border", { dirs: ["forward", "back"] });
          this.el.addEventListener("image-loaded", this.onMediaLoaded);
        } else if (
          contentType.includes("application/octet-stream") ||
          contentType.includes("x-zip-compressed") ||
          contentType.startsWith("model/gltf")
        ) {
          this.el.setAttribute("networked", { template: "#interactable-media-gltf" });
          this.el.setAttribute("gltf-model-plus", { src: src });
          this.el.addEventListener("model-loaded", this.onMediaLoaded);
        }
      }

      this.el.removeAttribute("loading-indicator");
    } catch (e) {
      this.el.setAttribute("media-image", { src: "error" });
      throw e;
    }
  },

  onMediaLoaded(e) {
    console.log("media-loaded do the model scaling stuff", e);
    clearTimeout(this.fireLoadingTimeout);
    this.el.removeEventListener("image-loaded", this.onMediaLoaded);
    this.el.removeEventListener("video-loaded", this.onMediaLoaded);
    this.el.removeEventListener("model-loaded", this.onMediaLoaded);

    if (!this.el.classList.contains("pen")) {
      this.el.object3D.scale.setScalar(0.5);

      this.el.setAttribute("animation__spawn-start", {
        property: "scale",
        delay: 50,
        dur: 300,
        from: { x: 0.5, y: 0.5, z: 0.5 },
        to: { x: 1.0, y: 1.0, z: 1.0 },
        easing: "easeOutElastic"
      });
    }

    this.el.setAttribute("offset-relative-to", {
      target: this.data.target,
      offset: this.data.offset,
      orientation: this.orientation
    });

    if (this.data.contentOrigin) {
      const objectType = objectTypeForOriginAndContentType(this.data.contentOrigin, this.contentType);
      this.el.sceneEl.emit("object_spawned", { objectType });
    }

    console.log("media-loaded");
    this.el.sceneEl.emit("media-loaded", { src: this.data.src });
  },

  update(oldData) {
    const src = this.data.src;

    console.log("update", src, oldData);

    if (oldData.src) {
      // You cannot change the src of spawned-media
      return;
    }

    this.spawnMedia(src).catch(e => {
      console.error("Error spawning media", src, e);
    });
  }
});
