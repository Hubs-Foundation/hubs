import GIFWorker from "../workers/gifparsing.worker.js";
import errorImageSrc from "!!url-loader!../assets/images/media-error.gif";

class GIFTexture extends THREE.Texture {
  constructor(frames, delays, disposals) {
    super(document.createElement("canvas"));
    this.image.width = frames[0].width;
    this.image.height = frames[0].height;

    this._ctx = this.image.getContext("2d");

    this.generateMipmaps = false;
    this.isVideoTexture = true;
    this.minFilter = THREE.NearestFilter;

    this.frames = frames;
    this.delays = delays;
    this.disposals = disposals;

    this.frame = 0;
    this.frameStartTime = Date.now();
  }

  update() {
    if (!this.frames || !this.delays || !this.disposals) return;
    const now = Date.now();
    if (now - this.frameStartTime > this.delays[this.frame]) {
      if (this.disposals[this.frame] === 2) {
        this._ctx.clearRect(0, 0, this.image.width, this.image.width);
      }
      this.frame = (this.frame + 1) % this.frames.length;
      this.frameStartTime = now;
      this._ctx.drawImage(this.frames[this.frame], 0, 0, this.image.width, this.image.height);
      this.needsUpdate = true;
    }
  }
}

/**
 * Create video element to be used as a texture.
 *
 * @param {string} src - Url to a video file.
 * @returns {Element} Video element.
 */
function createVideoEl(src) {
  const videoEl = document.createElement("video");
  videoEl.setAttribute("playsinline", "");
  videoEl.setAttribute("webkit-playsinline", "");
  videoEl.autoplay = true;
  videoEl.loop = true;
  videoEl.crossOrigin = "anonymous";
  videoEl.src = src;
  return videoEl;
}

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin("anonymous");

const textureCache = new Map();

const errorImage = new Image();
errorImage.src = errorImageSrc;
const errorTexture = new THREE.Texture(errorImage);
errorTexture.magFilter = THREE.NearestFilter;
errorImage.onload = () => {
  errorTexture.needsUpdate = true;
};

AFRAME.registerComponent("image-plus", {
  dependencies: ["geometry"],

  schema: {
    src: { type: "string" },
    contentType: { type: "string" }
  },

  _fit(w, h) {
    const ratio = (h || 1.0) / (w || 1.0);
    const geo = this.el.geometry;
    let width, height;
    if (geo && geo.width) {
      if (geo.height && ratio > 1) {
        width = geo.width / ratio;
      } else {
        height = geo.height * ratio;
      }
    } else if (geo && geo.height) {
      width = geo.width / ratio;
    } else {
      width = Math.min(1.0, 1.0 / ratio);
      height = Math.min(1.0, ratio);
    }
    this.el.setAttribute("geometry", { width, height });
    this.el.setAttribute("shape", {
      shape: "box",
      halfExtents: {
        x: width / 2,
        y: height / 2,
        z: 0.05
      }
    });
  },

  init() {
    const material = new THREE.MeshBasicMaterial();
    material.side = THREE.DoubleSide;
    material.transparent = true;
    this.el.getObject3D("mesh").material = material;
  },

  remove() {
    const material = this.el.getObject3D("mesh").material;
    const texture = material.map;

    if (texture === errorTexture) return;

    const url = texture.image.src;
    const cacheItem = textureCache.get(url);
    cacheItem.count--;
    if (cacheItem.count <= 0) {
      // Unload the video element to prevent it from continuing to play in the background
      if (texture.image instanceof HTMLVideoElement) {
        const video = texture.image;
        video.pause();
        video.src = "";
        video.load();
      }

      texture.dispose();

      // THREE never lets go of material refs, long running PR HERE https://github.com/mrdoob/three.js/pull/12464
      // Mitigate the damage a bit by at least breaking the image ref so Image/Video elements can be freed
      // TODO: If/when THREE gets fixed, we should be able to safely remove this
      delete texture.image;

      textureCache.delete(url);
    }
  },

  async loadGIF(url) {
    return new Promise((resolve, reject) => {
      // TODO: pool workers
      const worker = new GIFWorker();
      worker.onmessage = e => {
        const [success, frames, delays, disposals] = e.data;
        if (!success) {
          reject(`error loading gif: ${e.data[1]}`);
          return;
        }

        let loadCnt = 0;
        for (let i = 0; i < frames.length; i++) {
          const img = new Image();
          img.onload = e => {
            loadCnt++;
            frames[i] = e.target;
            if (loadCnt === frames.length) {
              const texture = new GIFTexture(frames, delays, disposals);
              texture.image.src = url;
              resolve(texture);
            }
          };
          img.src = frames[i];
        }
      };
      fetch(url, { mode: "cors" })
        .then(r => r.arrayBuffer())
        .then(rawImageData => {
          worker.postMessage(rawImageData, [rawImageData]);
        })
        .catch(reject);
    });
  },

  loadVideo(url) {
    return new Promise((resolve, reject) => {
      const videoEl = createVideoEl(url);

      const texture = new THREE.VideoTexture(videoEl);
      texture.minFilter = THREE.LinearFilter;
      videoEl.addEventListener("loadedmetadata", () => resolve(texture), { once: true });
      videoEl.onerror = reject;

      // If iOS and video is HLS, do some hacks.
      if (
        this.el.sceneEl.isIOS &&
        AFRAME.utils.material.isHLS(
          videoEl.src || videoEl.getAttribute("src"),
          videoEl.type || videoEl.getAttribute("type")
        )
      ) {
        // Actually BGRA. Tell shader to correct later.
        texture.format = THREE.RGBAFormat;
        texture.needsCorrectionBGRA = true;
        // Apparently needed for HLS. Tell shader to correct later.
        texture.flipY = false;
        texture.needsCorrectionFlipY = true;
      }
    });
  },

  loadImage(url) {
    return new Promise((resolve, reject) => {
      textureLoader.load(url, resolve, null, function(xhr) {
        reject(`'${url}' could not be fetched (Error code: ${xhr.status}; Response: ${xhr.statusText})`);
      });
    });
  },

  async update() {
    let texture;
    try {
      const url = this.data.src;
      const contentType = this.data.contentType;
      if (!url) {
        return;
      }

      if (textureCache.has(url)) {
        const cacheItem = textureCache.get(url);
        texture = cacheItem.texture;
        cacheItem.count++;
      } else {
        if (url === "error") {
          texture = errorTexture;
        } else if (contentType === "image/gif") {
          texture = await this.loadGIF(url);
        } else if (contentType.startsWith("image/")) {
          texture = await this.loadImage(url);
        } else if (contentType.startsWith("video")) {
          texture = await this.loadVideo(url);
        } else {
          throw new Error(`Unknown centent type: ${contentType}`);
        }

        textureCache.set(url, { count: 1, texture });
      }
    } catch (e) {
      console.error("Error loading media", this.data.src, e);
      texture = errorTexture;
    }

    const material = this.el.getObject3D("mesh").material;
    material.map = texture;
    material.needsUpdate = true;
    this._fit(texture.image.videoWidth || texture.image.width, texture.image.videoHeight || texture.image.height);
  }
});
