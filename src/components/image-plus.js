import GIFWorker from "../workers/gifparsing.worker.js";

class GIFTexture extends THREE.Texture {
  constructor(frames, delays, disposals) {
    super(document.createElement("canvas"));
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
errorImage.src =
  "data:image/png;base64,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";
const errorTexture = new THREE.Texture(errorImage);
errorImage.onload = () => {
  errorTexture.needsUpdate = true;
};

AFRAME.registerComponent("image-plus", {
  dependencies: ["geometry"],

  schema: {
    src: { type: "string" },
    contentType: { type: "string" },

    initialOffset: { default: { x: 0, y: 0, z: -1.5 } },
    reorientOnGrab: { default: false }
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

  _onGrab: (function() {
    const q = new THREE.Quaternion();
    return function() {
      if (this.data.reorientOnGrab) {
        this.billboardTarget.getWorldQuaternion(q);
        this.el.body.quaternion.copy(q);
      }
    };
  })(),

  init() {
    this._onGrab = this._onGrab.bind(this);

    this.el.addEventListener("grab-start", this._onGrab);

    const material = new THREE.MeshBasicMaterial();
    material.side = THREE.DoubleSide;
    material.transparent = true;
    this.el.getObject3D("mesh").material = material;

    const worldPos = new THREE.Vector3().copy(this.data.initialOffset);
    this.billboardTarget = document.querySelector("#player-camera").object3D;
    this.billboardTarget.localToWorld(worldPos);
    this.el.object3D.position.copy(worldPos);
    this.billboardTarget.getWorldQuaternion(this.el.object3D.quaternion);
  },

  remove() {
    const material = this.el.getObject3D("mesh").material;
    const texture = material.map;

    if (texture === errorTexture) return;

    const url = texture.image.src;
    const cacheItem = textureCache.get(url);
    cacheItem.count--;
    if (cacheItem.count <= 0) {
      console.log("removing from cache");
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
      videoEl.addEventListener("loadedmetadata", () => resolve(texture));
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

      if (textureCache.has(url)) {
        const cacheItem = textureCache.get(url);
        texture = cacheItem.texture;
        cacheItem.count++;
      } else {
        if (url === "error") {
          texture = errorTexture;
        } else if (contentType === "image/gif") {
          console.log("load gif", contentType);
          texture = await this.loadGIF(url);
        } else if (contentType.startsWith("image/")) {
          console.log("load image", contentType);
          texture = await this.loadImage(url);
        } else if (contentType.startsWith("video")) {
          console.log("load video", contentType);
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
