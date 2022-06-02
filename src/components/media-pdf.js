import pdfjs from "pdfjs-dist";
import { SOUND_CAMERA_TOOL_TOOK_SNAPSHOT } from "../systems/sound-effects-system";
import { scaleToAspectRatio } from "../utils/scale-to-aspect-ratio";
import { errorTexture } from "../utils/error-texture";
import { createPlaneBufferGeometry } from "../utils/three-utils";
import { addAndArrangeMedia } from "../utils/media-utils";
const ONCE_TRUE = { once: true };
const TYPE_IMG_PNG = { type: "image/png" };

/**
 * Warning! This require statement is fragile!
 *
 * How it works:
 * require -> require the file after all import statements have been called, particularly the configs.js import which modifies __webpack_public_path__
 * !! -> don't run any other loaders
 * file-loader -> make webpack move the file into the dist directory and return the file path
 * outputPath -> where to put the file
 * name -> how to name the file
 * Then the path to the worker script
 */
pdfjs.GlobalWorkerOptions.workerSrc = require("!!file-loader?outputPath=assets/js&name=[name]-[hash].js!pdfjs-dist/build/pdf.worker.min.js");

AFRAME.registerComponent("media-pdf", {
  schema: {
    src: { type: "string" },
    projection: { type: "string", default: "flat" },
    contentType: { type: "string" },
    index: { default: 0 },
  },

  init() {
    this.snap = this.snap.bind(this);
    this.canvas = document.createElement("canvas");
    this.canvasContext = this.canvas.getContext("2d");
    this.localSnapCount = 0;
    this.isSnapping = false;
    this.onSnapImageLoaded = () => (this.isSnapping = false);
    this.texture = new THREE.CanvasTexture(this.canvas);

    this.texture.encoding = THREE.sRGBEncoding;
    this.texture.minFilter = THREE.LinearFilter;

    this.el.addEventListener("pager-snap-clicked", () => this.snap());
  },

  play() {
    this.el.components["listed-media"] && this.el.sceneEl.emit("listed_media_changed");
  },

  async snap() {
    if (this.isSnapping) return;
    this.isSnapping = true;
    this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CAMERA_TOOL_TOOK_SNAPSHOT);

    const blob = await new Promise(resolve => this.canvas.toBlob(resolve));
    const file = new File([blob], "snap.png", TYPE_IMG_PNG);

    this.localSnapCount++;
    const { entity } = addAndArrangeMedia(this.el, file, "photo-snapshot", this.localSnapCount, false, 1);
    entity.addEventListener("image-loaded", this.onSnapImageLoaded, ONCE_TRUE);
  },

  async update(oldData) {
    let texture;
    let ratio = 1;

    try {
      const { src, index } = this.data;
      if (!src) return;

      if (this.renderTask) {
        await this.renderTask.promise;
        if (src !== this.data.src || index !== this.data.index) return;
      }

      this.el.emit("pdf-loading");

      if (src !== oldData.src) {
        const loadingSrc = this.data.src;
        const pdf = await pdfjs.getDocument(src);
        if (loadingSrc !== this.data.src) return;

        this.pdf = pdf;
        this.el.setAttribute("media-pager", { maxIndex: this.pdf.numPages - 1 });
      }

      const page = await this.pdf.getPage(index + 1);
      if (src !== this.data.src || index !== this.data.index) return;

      const viewport = page.getViewport({ scale: 3 });
      const pw = viewport.width;
      const ph = viewport.height;
      texture = this.texture;
      ratio = ph / pw;

      this.canvas.width = pw;
      this.canvas.height = ph;

      this.renderTask = page.render({ canvasContext: this.canvasContext, viewport });

      await this.renderTask.promise;

      this.renderTask = null;

      if (src !== this.data.src || index !== this.data.index) return;
    } catch (e) {
      console.error("Error loading PDF", this.data.src, e);
      texture = errorTexture;
    }

    if (!this.mesh) {
      const material = new THREE.MeshBasicMaterial();
      const geometry = createPlaneBufferGeometry(1, 1, 1, 1, texture.flipY);
      material.side = THREE.DoubleSide;

      this.mesh = new THREE.Mesh(geometry, material);
      this.el.setObject3D("mesh", this.mesh);
    }

    this.mesh.material.transparent = texture == errorTexture;
    this.mesh.material.map = texture;
    this.mesh.material.map.needsUpdate = true;
    this.mesh.material.needsUpdate = true;

    scaleToAspectRatio(this.el, ratio);

    if (this.el.components["media-pager"] && this.el.components["media-pager"].data.index !== this.data.index) {
      this.el.setAttribute("media-pager", { index: this.data.index });
    }

    this.el.emit("pdf-loaded", { src: this.data.src });
  }
});
