import GIFWorker from "../workers/gifparsing.worker.js";
import errorImageSrc from "!!url-loader!../assets/images/media-error.gif";
import { resolveMedia } from "../utils/media-utils";

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
  schema: {
    src: { type: "string" },
    token: { type: "string" },
    contentType: { type: "string" },

    depth: { default: 0.05 }
  },

  releaseTexture(src) {
    const texture = this.mesh && this.mesh.material.map;
    if (!texture || this.mesh.material.map === errorTexture) return;

    this.mesh.material.map = null;
    this.mesh.material.needsUpdate = true;

    const cacheItem = textureCache.get(src);
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

      textureCache.delete(src);
    }
  },

  remove() {
    this.releaseTexture(this.data.src, this.data.mediaIndex);
    console.log(textureCache);
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

  async update(oldData) {
    let texture;
    try {
      const { src, token, contentType } = this.data;
      if (!src) return;

      if (this.mesh) {
        this.releaseTexture(oldData.src, oldData.mediaIndex);
      }

      let cacheItem;
      if (textureCache.has(src)) {
        cacheItem = textureCache.get(src);
        texture = cacheItem.texture;
        cacheItem.count++;
      } else {
        cacheItem = { count: 1 };
        if (src === "error") {
          texture = errorTexture;
        } else if (contentType.includes("image/gif")) {
          texture = await this.loadGIF(src);
        } else if (contentType.startsWith("image/")) {
          texture = await this.loadImage(src);
        } else if (contentType.startsWith("video/") || contentType.startsWith("audio/")) {
          texture = await this.loadVideo(src);
          cacheItem.audioSource = this.el.sceneEl.audioListener.context.createMediaElementSource(texture.image);
        } else {
          throw new Error(`Unknown content type: ${contentType}`);
        }

        texture.encoding = THREE.sRGBEncoding;
        texture.minFilter = THREE.LinearFilter;

        cacheItem.texture = texture;
        textureCache.set(src, cacheItem);
      }

      if (cacheItem.audioSource) {
        const sound = new THREE.PositionalAudio(this.el.sceneEl.audioListener);
        sound.setNodeSource(cacheItem.audioSource);
        this.el.setObject3D("sound", sound);
      }
    } catch (e) {
      console.error("Error loading media", this.data.src, e);
      texture = errorTexture;
    }

    const ratio =
      (texture.image.videoHeight || texture.image.height || 1.0) /
      (texture.image.videoWidth || texture.image.width || 1.0);
    const width = Math.min(1.0, 1.0 / ratio);
    const height = Math.min(1.0, ratio);

    if (!this.mesh) {
      const material = new THREE.MeshBasicMaterial();
      material.side = THREE.DoubleSide;
      material.transparent = true;
      material.map = texture;
      material.needsUpdate = true;

      const geometry = new THREE.PlaneGeometry();
      this.mesh = new THREE.Mesh(geometry, material);
    } else {
      const { material } = this.mesh;
      material.map = texture;
      material.needsUpdate = true;
      this.mesh.needsUpdate = true;
    }

    this.el.setObject3D("mesh", this.mesh);

    this.mesh.scale.set(width, height, 1);
    this.el.setAttribute("shape", {
      shape: "box",
      halfExtents: { x: width / 2, y: height / 2, z: this.data.depth }
    });

    // TODO: verify if we actually need to do this
    if (this.el.components.body && this.el.components.body.body) {
      this.el.components.body.syncToPhysics();
      this.el.components.body.updateCannonScale();
    }
    this.el.emit("image-loaded");
  }
});
