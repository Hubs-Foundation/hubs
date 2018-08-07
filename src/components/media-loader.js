import { getBox, getScaleCoefficient } from "../utils/auto-box-collider";
import { resolveMedia } from "../utils/media-utils";

const fetchContentType = async url => fetch(url, { method: "HEAD" }).then(r => r.headers.get("content-type"));

AFRAME.registerComponent("media-loader", {
  schema: {
    src: { type: "string" },
    token: { type: "string" },
    contentType: { type: "string" },
    resize: { default: false }
  },

  init() {
    this.onError = this.onError.bind(this);
    this.showLoader = this.showLoader.bind(this);
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
    this.el.setAttribute("image-plus", { src: "error" });
    clearTimeout(this.showLoaderTimeout);
  },

  showLoader() {
    const loadingObj = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    this.el.setObject3D("mesh", loadingObj);
    this.setShapeAndScale(true);
  },

  // TODO: correctly handle case where src changes
  async update() {
    try {
      const url = this.data.src;
      const token = this.data.token;

      this.showLoaderTimeout = this.showLoaderTimeout || setTimeout(this.showLoader, 100);

      if (!url) return;

      const { raw, origin, meta } = await resolveMedia(url);
      console.log("resolved", url, raw, origin, meta);

      const contentType =
        this.data.contentType || (meta && meta.expected_content_type) || (await fetchContentType(raw));
      let blobUrl;
      if (token) {
        const response = await fetch(raw, {
          method: "GET",
          headers: { Authorization: `Token ${token}` }
        });
        const blob = await response.blob();
        blobUrl = window.URL.createObjectURL(blob);
      }
      if (contentType.startsWith("image/") || contentType.startsWith("video/") || contentType.startsWith("audio/")) {
        this.el.addEventListener(
          "image-loaded",
          () => {
            clearTimeout(this.showLoaderTimeout);
          },
          { once: true }
        );
        this.el.setAttribute("image-plus", { src: blobUrl || raw, contentType });
        this.el.setAttribute("position-at-box-shape-border", { target: ".delete-button", dirs: ["forward", "back"] });
      } else if (
        contentType.indexOf("application/octet-stream") !== -1 ||
        contentType.indexOf("x-zip-compressed") !== -1 ||
        contentType.startsWith("model/gltf") ||
        url.endsWith(".gltf") ||
        url.endsWith(".glb")
      ) {
        this.el.addEventListener(
          "model-loaded",
          () => {
            clearTimeout(this.showLoaderTimeout);
            this.setShapeAndScale(this.data.resize);
          },
          { once: true }
        );
        this.el.addEventListener("model-error", this.onError, { once: true });
        this.el.setAttribute("gltf-model-plus", {
          src: blobUrl || raw,
          contentType,
          basePath: THREE.LoaderUtils.extractUrlBase(origin),
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
