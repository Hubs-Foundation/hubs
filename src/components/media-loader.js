import { getBox, getScaleCoefficient } from "../utils/auto-box-collider";
import { resolveMedia, fetchMaxContentIndex } from "../utils/media-utils";

AFRAME.registerComponent("media-loader", {
  schema: {
    src: { type: "string" },
    token: { type: "string" },
    index: { type: "number" },
    resize: { default: false }
  },

  init() {
    this.onError = this.onError.bind(this);
    this.showLoader = this.showLoader.bind(this);
  },

  remove() {
    if (this.blobURL) {
      URL.revokeObjectURL(this.blobURL);
      this.blobURL = null;
    }
  },

  setShapeAndScale(resize) {
    const mesh = this.el.getObject3D("mesh");
    const box = getBox(this.el, mesh);
    const scaleCoefficient = resize ? getScaleCoefficient(0.5, box) : 1;
    this.el.object3DMap.mesh.scale.multiplyScalar(scaleCoefficient);
    if (this.el.body && this.el.body.shapes.length > 1) {
      this.el.removeAttribute("shape");
    } else {
      const center = new THREE.Vector3();
      const { min, max } = box;
      const halfExtents = {
        x: (Math.abs(min.x - max.x) / 2) * scaleCoefficient,
        y: (Math.abs(min.y - max.y) / 2) * scaleCoefficient,
        z: (Math.abs(min.z - max.z) / 2) * scaleCoefficient
      };
      center.addVectors(min, max).multiplyScalar(0.5 * scaleCoefficient);
      mesh.position.sub(center);
      this.el.setAttribute("shape", {
        shape: "box",
        halfExtents: halfExtents
      });
    }
  },

  onError() {
    this.el.removeAttribute("gltf-model-plus");
    this.el.removeAttribute("media-pager");
    this.el.setAttribute("image-plus", { src: "error" });
    clearTimeout(this.showLoaderTimeout);
  },

  showLoader() {
    const loadingObj = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    this.el.setObject3D("mesh", loadingObj);
    this.setShapeAndScale(true);
    delete this.showLoaderTimeout;
  },

  // TODO: correctly handle case where src changes
  async update(oldData) {
    try {
      const { src, token, index } = this.data;

      if (src !== oldData.src && !this.showLoaderTimeout) {
        this.showLoaderTimeout = setTimeout(this.showLoader, 100);
      }

      if (!src) return;

      const { raw, images, contentType } = await resolveMedia(src, token, false, index);

      if (token) {
        if (this.blobURL) {
          URL.revokeObjectURL(this.blobURL);
          this.blobURL = null;
        }
        const response = await fetch(raw, {
          method: "GET",
          headers: { Authorization: `Token ${token}` }
        });
        const blob = await response.blob();
        this.blobURL = window.URL.createObjectURL(blob);
      }

      if (
        contentType.startsWith("image/") ||
        contentType.startsWith("video/") ||
        contentType.startsWith("audio/") ||
        contentType === "application/pdf"
      ) {
        this.el.removeAttribute("gltf-model-plus");
        this.el.addEventListener(
          "image-loaded",
          async () => {
            clearTimeout(this.showLoaderTimeout);
            delete this.showLoaderTimeout;
            if (contentType === "application/pdf") {
              const maxIndex = await fetchMaxContentIndex(src, images.png);
              this.el.setAttribute("media-pager", { index, maxIndex });
            }
          },
          { once: true }
        );
        let imageSrc = contentType === "application/pdf" ? images.png : raw;
        let imageContentType = contentType === "application/pdf" ? "image/png" : contentType;

        if (contentType === "application/pdf") {
          imageSrc = images.png;
          imageContentType = "image/png";
        } else {
          this.el.removeAttribute("media-pager");
        }

        this.el.setAttribute("image-plus", { src: this.blobUrl || imageSrc, contentType: imageContentType, token });
        this.el.setAttribute("position-at-box-shape-border", { dirs: ["forward", "back"] });
      } else if (
        contentType.includes("application/octet-stream") ||
        contentType.includes("x-zip-compressed") ||
        contentType.startsWith("model/gltf") ||
        src.endsWith(".gltf") ||
        src.endsWith(".glb")
      ) {
        this.el.removeAttribute("image-plus");
        this.el.removeAttribute("media-pager");
        this.el.addEventListener(
          "model-loaded",
          () => {
            clearTimeout(this.showLoaderTimeout);
            this.setShapeAndScale(this.data.resize);
            delete this.showLoaderTimeout;
          },
          { once: true }
        );
        this.el.addEventListener("model-error", this.onError, { once: true });
        const modelSrc = this.blobURL || src;
        this.el.setAttribute("gltf-model-plus", {
          src: modelSrc,
          contentType,
          inflate: true
        });
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
    } catch (e) {
      console.error("Error adding media", e);
      this.onError();
    }
  }
});

AFRAME.registerComponent("media-pager", {
  schema: {
    index: { type: "string" },
    maxIndex: { type: "string" }
  },

  init() {
    this.onNext = this.onNext.bind(this);
    this.onPrev = this.onPrev.bind(this);

    const tempalte = document.getElementById("paging-toolbar");
    this.el.appendChild(document.importNode(tempalte.content, true));
    this.toolbar = this.el.querySelector(".paging-toolbar");
    // we have to wait a tick for the attach callbacks to get fired for the elements in a tempalte
    setTimeout(() => {
      this.nextButton = this.el.querySelector(".next-button [text-button]");
      this.prevButton = this.el.querySelector(".prev-button [text-button]");
      this.pageLabel = this.el.querySelector(".page-label");

      this.nextButton.addEventListener("click", this.onNext);
      this.prevButton.addEventListener("click", this.onPrev);

      this.update();
    }, 0);
  },

  update() {
    if (!this.pageLabel) return;
    this.pageLabel.setAttribute("text", "value", `${this.data.index + 1}/${this.data.maxIndex + 1}`);
    this.repositionToolbar();
  },

  remove() {
    this.nextButton.removeEventListener("click", this.onNext);
    this.prevButton.removeEventListener("click", this.onPrev);
    this.el.removeChild(this.toolbar);
  },

  onNext() {
    this.el.setAttribute("media-loader", "index", Math.min(this.data.index + 1, this.data.maxIndex));
  },

  onPrev() {
    this.el.setAttribute("media-loader", "index", Math.max(this.data.index - 1, 0));
  },

  repositionToolbar() {
    this.toolbar.object3D.position.y = -this.el.getAttribute("shape").halfExtents.y - 0.2;
  }
});
