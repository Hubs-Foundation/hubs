import JSZip from "jszip";

import { getBox, getScaleCoefficient } from "../utils/auto-box-collider";
import { resolveFarsparkUrl } from "../utils/media-utils";

const fetchContentType = async url => fetch(url, { method: "HEAD" }).then(r => r.headers.get("content-type"));

AFRAME.registerComponent("media-loader", {
  schema: {
    src: { type: "string" },
    resize: { default: false }
  },

  init() {
    this.onError = this.onError.bind(this);
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

  // TODO: correctly handle case where src changes
  async update() {
    try {
      const url = this.data.src;

      this.showLoaderTimeout = setTimeout(() => {
        const loadingObj = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
        this.el.setObject3D("mesh", loadingObj);
        this.setShapeAndScale(true);
      }, 100);

      const { raw, origin, meta } = await resolveFarsparkUrl(url);
      console.log("resolved", url, raw, origin, meta);

      const contentType = (meta && meta.expected_content_type) || (await fetchContentType(raw));
      if (contentType.startsWith("image/") || contentType.startsWith("video/") || contentType.startsWith("audio/")) {
        this.el.addEventListener(
          "image-loaded",
          () => {
            clearTimeout(this.showLoaderTimeout);
          },
          { once: true }
        );
        this.el.setAttribute("image-plus", { src: raw, contentType });
        this.el.setAttribute("position-at-box-shape-border", { target: ".delete-button", dirs: ["forward", "back"] });
      } else if (contentType.startsWith("model/gltf") || url.endsWith(".gltf") || url.endsWith(".glb")) {
        let gltfUrl = raw;
        if (contentType === "model/gltf+zip") {
          gltfUrl = await fetch(raw)
            .then(r => r.blob())
            .then(JSZip.loadAsync)
            .then(async zip => {
              const gltf = JSON.parse(await zip.file("scene.gltf").async("text"));
              const fileMap = await Object.values(zip.files).reduce(async (prev, file) => {
                if (file.name === "scene.gltf") return prev;
                const out = await prev;
                out[file.name] = URL.createObjectURL(await file.async("blob"));
                return out;
              }, Promise.resolve({}));
              gltf.buffers && gltf.buffers.forEach(b => (b.uri = fileMap[b.uri]));
              gltf.images && gltf.images.forEach(i => (i.uri = fileMap[i.uri]));
              return URL.createObjectURL(new Blob([JSON.stringify(gltf, null, 2)], { type: "text/plain" }));
            });
        }
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
          src: gltfUrl,
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
