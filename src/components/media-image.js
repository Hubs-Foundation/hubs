import errorImageSrc from "!!url-loader!../assets/images/media-error.gif";
import { guessContentType, proxiedUrlFor, resolveUrl, fetchContentType } from "../utils/media-utils";
import { loadGIFTexture } from "../utils/GIFTexture";
import loadTexture from "../utils/loadTexture";

AFRAME.registerComponent("media-image", {
  schema: {
    src: { type: "string" },
    resolve: { type: "boolean", default: true },
    contentType: { type: "string" }
  },

  init() {
    const material = new THREE.MeshBasicMaterial();
    material.side = THREE.DoubleSide;
    const geometry = new THREE.PlaneGeometry();
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.visible = false;
    this.el.setObject3D("mesh", this.mesh);

    this.textureCache = this.el.sceneEl.systems["texture-cache"].cache;
  },

  async loadImageTexture(src) {
    if (this.textureCache.has(src)) {
      return await this.textureCache.retain(src);
    }

    if (src === "error") {
      const pendingErrorTexture = loadTexture(errorImageSrc);
      this.textureCache.set(src, pendingErrorTexture);
      return await pendingErrorTexture;
    }

    let contentType = this.data.contentType;
    let accessibleUrl = src;

    // Resolve the image url / content type from the media API
    if (this.data.resolve) {
      const result = await resolveUrl(src);
      const canonicalUrl = result.origin;
      accessibleUrl = proxiedUrlFor(canonicalUrl);

      contentType =
        (result.meta && result.meta.expected_content_type) ||
        guessContentType(canonicalUrl) ||
        (await fetchContentType(accessibleUrl));
    }

    let pendingTexture;

    if (contentType.includes("image/gif")) {
      pendingTexture = loadGIFTexture(accessibleUrl);
    } else if (contentType.startsWith("image/")) {
      pendingTexture = loadTexture(accessibleUrl);
    } else {
      throw new Error(`Unknown image content type "${contentType}" for image: "${src}"`);
    }

    this.textureCache.set(src, pendingTexture);
    return await pendingTexture;
  },

  async setImage(src) {
    let texture;

    try {
      // If there is an existing image, clear it.
      if (this.mesh.material.map) {
        this.mesh.material.map = null;
        this.mesh.material.needsUpdate = true;
        this.mesh.visible = false;

        if (this.data.src !== "error") {
          this.textureCache.release(src);
        }
      }

      this.el.setAttribute("loading-indicator", "");
      this.el.setAttribute("shape", {
        shape: "box",
        halfExtents: { x: 1, y: 1, z: 1 }
      });

      texture = await this.loadImageTexture(src);
    } catch (e) {
      // If there was an error show the error texture.
      texture = await this.loadImageTexture("error");
      throw e;
    } finally {
      if (this.data.src !== src) {
        // If the image changed while loading. Remove it from the cache and don't set it.
        if (this.data.src !== "error") {
          this.textureCache.release(src);
        }
      } else {
        this.el.emit("image-loaded", { src: this.data.src });
        this.el.removeAttribute("loading-indicator");

        this.mesh.material.map = texture;
        this.mesh.material.needsUpdate = true;
        this.mesh.visible = true;

        // Scale the mesh to maintain the texture's aspect ratio.
        const ratio = (texture.image.height || 1.0) / (texture.image.width || 1.0);
        const width = Math.min(1.0, 1.0 / ratio);
        const height = Math.min(1.0, ratio);
        this.mesh.scale.set(width, height, 1);

        // Scale the box collider to fit the texture.
        this.el.setAttribute("shape", {
          shape: "box",
          halfExtents: { x: width / 2, y: height / 2, z: 0.05 }
        });
      }
    }
  },

  update(oldData) {
    const src = this.data.src;

    // If the image didn't change, do nothing.
    if (src === oldData.src) {
      return;
    }

    // Asynchronously load and set the image.
    this.setImage(src).catch(e => {
      console.error("Error loading image", src, e);
    });
  },

  remove() {
    if (this.data.src !== "error") {
      this.textureCache.release(this.data.src);
    }

    this.el.removeAttribute("loading-indicator");
    this.el.removeAttribute("shape");
  }
});
