import { getBox, getScaleCoefficient } from "../utils/auto-box-collider";
import { guessContentType, proxiedUrlFor, resolveUrl, injectCustomShaderChunks } from "../utils/media-utils";
import { addAnimationComponents } from "../utils/animation";

import "three/examples/js/loaders/GLTFLoader";
import loadingObjectSrc from "../assets/LoadingObject_Atom.glb";

const gltfLoader = new THREE.GLTFLoader();
let loadingObject;
gltfLoader.load(loadingObjectSrc, gltf => {
  loadingObject = gltf;
});

const fetchContentType = url => {
  return fetch(url, { method: "HEAD" }).then(r => r.headers.get("content-type"));
};

const fetchMaxContentIndex = url => {
  return fetch(url).then(r => parseInt(r.headers.get("x-max-content-index")));
};

const boundingBox = new THREE.Box3();

AFRAME.registerComponent("media-loader", {
  schema: {
    fileId: { type: "string" },
    fileIsOwned: { type: "boolean" },
    src: { type: "string" },
    resize: { default: false },
    resolve: { default: false },
    contentType: { default: null },
    mediaOptions: {
      default: {},
      parse: v => (typeof v === "object" ? v : JSON.parse(v)),
      stringify: JSON.stringify
    }
  },

  init() {
    this.onError = this.onError.bind(this);
    this.showLoader = this.showLoader.bind(this);
    this.clearLoadingTimeout = this.clearLoadingTimeout.bind(this);
    this.onMediaLoaded = this.onMediaLoaded.bind(this);
    this.shapeAdded = false;
    this.hasBakedShapes = false;
  },

  setShapeAndScale(resize) {
    const mesh = this.el.getObject3D("mesh");
    const box = getBox(this.el, mesh);
    const scaleCoefficient = resize ? getScaleCoefficient(0.5, box) : 1;
    this.el.object3DMap.mesh.scale.multiplyScalar(scaleCoefficient);

    if (this.el.body && this.shapeAdded && this.el.body.shapes.length > 1) {
      this.el.removeAttribute("shape");
      this.shapeAdded = false;
    } else if (!this.hasBakedShapes && !box.isEmpty()) {
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
      this.shapeAdded = true;
    }

    mesh.matrixNeedsUpdate = true;
  },

  tick(t, dt) {
    if (this.loaderMixer) {
      this.loaderMixer.update(dt / 1000);
    }
  },

  onError() {
    this.el.removeAttribute("gltf-model-plus");
    this.el.removeAttribute("media-pager");
    this.el.removeAttribute("media-video");
    this.el.setAttribute("media-image", { src: "error" });
    clearTimeout(this.showLoaderTimeout);
    delete this.showLoaderTimeout;
  },

  showLoader() {
    const useFancyLoader = !!loadingObject;
    const mesh = useFancyLoader
      ? loadingObject.scene.clone()
      : new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    if (useFancyLoader) {
      this.loaderMixer = new THREE.AnimationMixer(mesh);
      this.loadingClip = this.loaderMixer.clipAction(loadingObject.animations[0]);
      this.loadingClip.play();
    }
    this.el.setObject3D("mesh", mesh);
    this.hasBakedShapes = !!(this.el.body && this.el.body.shapes.length > 0);
    this.setShapeAndScale(true);
    delete this.showLoaderTimeout;
  },

  clearLoadingTimeout() {
    clearTimeout(this.showLoaderTimeout);
    if (this.loaderMixer) {
      this.loadingClip.stop();
      delete this.loaderMixer;
    }
    delete this.showLoaderTimeout;
  },

  setupHoverableVisuals() {
    const hoverableVisuals = this.el.components["hoverable-visuals"];
    if (hoverableVisuals) {
      hoverableVisuals.uniforms = injectCustomShaderChunks(this.el.object3D);
      boundingBox.setFromObject(this.el.object3DMap.mesh);
      boundingBox.getBoundingSphere(hoverableVisuals.boundingSphere);
    }
  },

  onMediaLoaded() {
    this.clearLoadingTimeout();
    this.setupHoverableVisuals();
  },

  async update(oldData) {
    try {
      const { src } = this.data;

      if (src !== oldData.src && !this.showLoaderTimeout) {
        this.showLoaderTimeout = setTimeout(this.showLoader, 100);
      }

      if (!src) return;

      let canonicalUrl = src;
      let accessibleUrl = src;
      let contentType = this.data.contentType;

      if (this.data.resolve) {
        const result = await resolveUrl(src);
        canonicalUrl = result.origin;
        // handle protocol relative urls
        if (canonicalUrl.startsWith("//")) {
          canonicalUrl = location.protocol + canonicalUrl;
        }
        contentType = (result.meta && result.meta.expected_content_type) || contentType;
      }

      // todo: we don't need to proxy for many things if the canonical URL has permissive CORS headers
      accessibleUrl = proxiedUrlFor(canonicalUrl, null);

      // if the component creator didn't know the content type, we didn't get it from reticulum, and
      // we don't think we can infer it from the extension, we need to make a HEAD request to find it out
      contentType = contentType || guessContentType(canonicalUrl) || (await fetchContentType(accessibleUrl));

      // We don't want to emit media_resolved for index updates.
      if (src !== oldData.src) {
        this.el.emit("media_resolved", { src, raw: accessibleUrl, contentType });
      }

      if (
        contentType.startsWith("video/") ||
        contentType.startsWith("audio/") ||
        AFRAME.utils.material.isHLS(canonicalUrl, contentType)
      ) {
        const parsedUrl = new URL(src);
        const qsTime = parseInt(parsedUrl.searchParams.get("t"));
        const hashTime = parseInt(new URLSearchParams(parsedUrl.hash.substring(1)).get("t"));
        const startTime = hashTime || qsTime || 0;
        this.el.removeAttribute("gltf-model-plus");
        this.el.removeAttribute("media-image");
        this.el.addEventListener("video-loaded", this.onMediaLoaded, { once: true });
        this.el.setAttribute(
          "media-video",
          Object.assign({}, this.data.mediaOptions, { src: accessibleUrl, time: startTime, contentType })
        );
        if (this.el.components["position-at-box-shape-border__freeze"]) {
          this.el.setAttribute("position-at-box-shape-border__freeze", { dirs: ["forward", "back"] });
        }
      } else if (contentType.startsWith("image/")) {
        this.el.removeAttribute("gltf-model-plus");
        this.el.removeAttribute("media-video");
        this.el.addEventListener("image-loaded", this.onMediaLoaded, { once: true });
        this.el.removeAttribute("media-pager");
        this.el.setAttribute(
          "media-image",
          Object.assign({}, this.data.mediaOptions, { src: accessibleUrl, contentType })
        );
        if (this.el.components["position-at-box-shape-border"]) {
          this.el.setAttribute("position-at-box-shape-border", { dirs: ["forward", "back"] });
        }
      } else if (contentType.startsWith("application/pdf")) {
        this.el.removeAttribute("gltf-model-plus");
        this.el.removeAttribute("media-video");
        // two small differences:
        // 1. we pass the canonical URL to the pager so it can easily make subresource URLs
        // 2. we don't remove the media-image component -- media-pager uses that internally
        this.el.setAttribute("media-pager", Object.assign({}, this.data.mediaOptions, { src: canonicalUrl }));
        this.el.addEventListener("image-loaded", this.clearLoadingTimeout, { once: true });
        this.el.addEventListener("preview-loaded", this.onMediaLoaded, { once: true });
        if (this.el.components["position-at-box-shape-border"]) {
          this.el.setAttribute("position-at-box-shape-border", { dirs: ["forward", "back"] });
        }
      } else if (
        contentType.includes("application/octet-stream") ||
        contentType.includes("x-zip-compressed") ||
        contentType.startsWith("model/gltf")
      ) {
        this.el.removeAttribute("media-image");
        this.el.removeAttribute("media-video");
        this.el.removeAttribute("media-pager");
        this.el.addEventListener(
          "model-loaded",
          () => {
            this.clearLoadingTimeout();
            this.hasBakedShapes = !!(this.el.body && this.el.body.shapes.length > (this.shapeAdded ? 1 : 0));
            this.setShapeAndScale(this.data.resize);
            this.setupHoverableVisuals();
            addAnimationComponents(this.el);
          },
          { once: true }
        );
        this.el.addEventListener("model-error", this.onError, { once: true });
        this.el.setAttribute(
          "gltf-model-plus",
          Object.assign({}, this.data.mediaOptions, {
            src: accessibleUrl,
            contentType: contentType,
            inflate: true,
            modelToWorldScale: this.data.resize ? 0.0001 : 1.0
          })
        );
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
    src: { type: "string" },
    index: { default: 0 }
  },

  init() {
    this.toolbar = null;
    this.imageSrc = null;
    this.onNext = this.onNext.bind(this);
    this.onPrev = this.onPrev.bind(this);

    this.el.addEventListener("image-loaded", async e => {
      this.imageSrc = e.detail.src;
      await this._ensureUI();
      this.update();
    });
  },

  async _ensureUI() {
    if (this.toolbar || !this.imageSrc) return;
    // unfortunately, since we loaded the page image in an img tag inside media-image, we have to make a second
    // request for the same page to read out the max-content-index header
    this.maxIndex = await fetchMaxContentIndex(this.imageSrc);
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

      this.update();
      this.el.emit("preview-loaded");
    }, 0);
  },

  async update() {
    if (!this.data.src) return;

    const pageSrc = proxiedUrlFor(this.data.src, this.data.index);
    this.el.setAttribute("media-image", { src: pageSrc, contentType: "image/png" });

    await this._ensureUI();

    if (this.pageLabel) {
      this.pageLabel.setAttribute("text", "value", `${this.data.index + 1}/${this.maxIndex + 1}`);
      this.repositionToolbar();
    }
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
    this.toolbar.object3D.matrixNeedsUpdate = true;
  }
});
