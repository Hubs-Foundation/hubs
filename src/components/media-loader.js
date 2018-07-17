import { getBox, getCenterAndHalfExtents, getScaleCoefficient } from "../utils/auto-box-collider";
import { resolveFarsparkUrl } from "../utils/media-utils";

const fetchContentType = async url => fetch(url, { method: "HEAD" }).then(r => r.headers.get("content-type"));

AFRAME.registerComponent("media-loader", {
  schema: {
    src: { type: "string" }
  },

  setShapeAndScale() {
    const mesh = this.el.getObject3D("mesh");
    const box = getBox(this.el, mesh);
    const scaleCoefficient = getScaleCoefficient(0.5, box);
    if (this.el.body && this.el.body.shapes.length > 1) {
      this.el.removeAttribute("shape");
    } else {
      const center = new THREE.Vector3();
      const halfExtents = new THREE.Vector3();
      getCenterAndHalfExtents(this.el, box, center, halfExtents);
      mesh.position.sub(center);
      this.el.setAttribute("shape", {
        shape: "box",
        halfExtents: halfExtents
      });
    }
    const scale = this.el.object3D.scale;
    this.el.setAttribute("scale", {
      x: scale.x * scaleCoefficient,
      y: scale.y * scaleCoefficient,
      z: scale.z * scaleCoefficient
    });
  },

  // TODO: correctly handle case where src changes
  async update() {
    try {
      const url = this.data.src;

      // show loading mesh
      this.el.setObject3D("mesh", new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));
      this.setShapeAndScale();

      const { raw, origin, meta } = await resolveFarsparkUrl(url);
      console.log("resolved", url, raw, origin, meta);

      const contentType = (meta && meta.expected_content_type) || (await fetchContentType(raw));
      if (contentType.startsWith("image/") || contentType.startsWith("video/")) {
        this.el.setAttribute("image-plus", { src: raw, contentType });
      } else if (contentType.startsWith("model/gltf") || url.endsWith(".gltf") || url.endsWith(".glb")) {
        this.el.addEventListener("model-loaded", evt => this.setShapeAndScale(), { once: true });
        this.el.setAttribute("gltf-model-plus", {
          src: raw,
          basePath: THREE.LoaderUtils.extractUrlBase(origin),
          inflate: true
        });
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
    } catch (e) {
      console.error("Error adding media", e);
      this.el.setAttribute("image-plus", { src: "error" });
    }
  }
});
