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

async function createGIFTexture(url) {
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
            texture.encoding = THREE.sRGBEncoding;
            texture.minFilter = THREE.LinearFilter;
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
  videoEl.loop = true;
  videoEl.crossOrigin = "anonymous";
  videoEl.src = src;
  return videoEl;
}

function createVideoTexture(url) {
  return new Promise((resolve, reject) => {
    const videoEl = createVideoEl(url);

    const texture = new THREE.VideoTexture(videoEl);
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;

    videoEl.addEventListener("loadedmetadata", () => resolve(texture), { once: true });
    videoEl.onerror = reject;

    // If iOS and video is HLS, do some hacks.
    if (
      AFRAME.utils.device.isIOS() &&
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
}

function createPlaneMesh(texture) {
  const material = new THREE.MeshBasicMaterial();
  material.side = THREE.DoubleSide;
  material.transparent = true;
  material.map = texture;
  material.needsUpdate = true;

  const geometry = new THREE.PlaneGeometry();
  return new THREE.Mesh(geometry, material);
}

function fitToTexture(el, texture) {
  const ratio =
    (texture.image.videoHeight || texture.image.height || 1.0) /
    (texture.image.videoWidth || texture.image.width || 1.0);
  const width = Math.min(1.0, 1.0 / ratio);
  const height = Math.min(1.0, ratio);
  el.object3DMap.mesh.scale.set(width, height, 1);
  el.setAttribute("shape", {
    shape: "box",
    halfExtents: { x: width / 2, y: height / 2, z: 0.05 }
  });
}

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin("anonymous");
function createImageTexture(url) {
  return new Promise((resolve, reject) => {
    textureLoader.load(
      url,
      texture => {
        texture.encoding = THREE.sRGBEncoding;
        texture.minFilter = THREE.LinearFilter;
        resolve(texture);
      },
      null,
      function(xhr) {
        reject(`'${url}' could not be fetched (Error code: ${xhr.status}; Response: ${xhr.statusText})`);
      }
    );
  });
}

function disposeTexture(texture) {
  if (texture.image instanceof HTMLVideoElement) {
    const video = texture.image;
    video.pause();
    video.src = "";
    video.load();
  }
  texture.dispose();
}

class TextureCache {
  cache = new Map();

  set(src, texture) {
    this.cache.set(src, {
      texture,
      count: 0
    });
    this.retain(src);
  }

  has(src) {
    return this.cache.has(src);
  }

  get(src) {
    return this.cache.get(src).texture;
  }

  retain(src) {
    const cacheItem = this.cache.get(src);
    cacheItem.count++;
    // console.log("retain", src, cacheItem.count);
    return cacheItem.texture;
  }

  release(src) {
    const cacheItem = this.cache.get(src);
    cacheItem.count--;
    // console.log("release", src, cacheItem.count);
    if (cacheItem.count <= 0) {
      // Unload the video element to prevent it from continuing to play in the background
      disposeTexture(cacheItem.texture);
      this.cache.delete(src);
    }
  }
}

const textureCache = new TextureCache();

const errorImage = new Image();
errorImage.src = errorImageSrc;
const errorTexture = new THREE.Texture(errorImage);
errorTexture.magFilter = THREE.NearestFilter;
errorImage.onload = () => {
  errorTexture.needsUpdate = true;
};

AFRAME.registerComponent("media-video", {
  schema: {
    src: { type: "string" },
    time: { type: "number" },
    videoPaused: { type: "boolean" },
    tickRate: { default: 1000 }, // ms interval to send time interval updates
    syncTolerance: { default: 2 }
  },

  init() {
    this.onPauseStateChange = this.onPauseStateChange.bind(this);
    this.togglePlayingIfOwner = this.togglePlayingIfOwner.bind(this);

    this.lastUpdate = 0;

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.networkedEl = networkedEl;
      this.updatePlaybackState();
    });
  },

  // aframe component play, unrelated to video
  play() {
    this.el.addEventListener("click", this.togglePlayingIfOwner);
  },

  // aframe component pause, unrelated to video
  pause() {
    this.el.removeEventListener("click", this.togglePlayingIfOwner);
  },

  togglePlayingIfOwner() {
    if (this.networkedEl && NAF.utils.isMine(this.networkedEl) && this.video) {
      this.data.videoPaused ? this.video.play() : this.video.pause();
    }
  },

  remove() {
    if (this.mesh && this.mesh.material) {
      disposeTexture(this.mesh.material.map);
    }
    if (this.video) {
      this.video.removeEventListener("pause", this.onPauseStateChange);
      this.video.removeEventListener("play", this.onPauseStateChange);
    }
  },

  onPauseStateChange() {
    this.el.setAttribute("media-video", "videoPaused", this.video.paused);
  },

  async updateTexture(src) {
    let texture;
    try {
      texture = await createVideoTexture(src);

      // No way to cancel promises, so if src has changed while we were creating the texture just throw it away.
      if (this.data.src !== src) {
        disposeTexture(texture);
        return;
      }

      texture.audioSource = this.el.sceneEl.audioListener.context.createMediaElementSource(texture.image);
      this.video = texture.image;

      this.video.addEventListener("pause", this.onPauseStateChange);
      this.video.addEventListener("play", this.onPauseStateChange);

      const sound = new THREE.PositionalAudio(this.el.sceneEl.audioListener);
      sound.setNodeSource(texture.audioSource);
      this.el.setObject3D("sound", sound);
    } catch (e) {
      console.error("Error loading video", this.data.src, e);
      texture = errorTexture;
    }

    if (!this.mesh) {
      this.mesh = createPlaneMesh(texture);
      this.el.setObject3D("mesh", this.mesh);
    } else {
      const { material } = this.mesh;
      material.map = texture;
      material.needsUpdate = true;
      this.mesh.needsUpdate = true;
    }

    fitToTexture(this.el, texture);

    this.updatePlaybackState(true);

    this.el.emit("video-loaded");
  },

  updatePlaybackState(force) {
    if (force || (this.networkedEl && !NAF.utils.isMine(this.networkedEl) && this.video)) {
      if (Math.abs(this.data.time - this.video.currentTime) > this.data.syncTolerance) {
        this.video.currentTime = this.data.time;
      }
      this.data.videoPaused ? this.video.pause() : this.video.play();
    }
  },

  update(oldData) {
    const { src } = this.data;

    this.updatePlaybackState();

    if (!src || src === oldData.src) return;

    this.remove();
    if (this.mesh && this.mesh.material) {
      this.mesh.material.map = null;
      this.mesh.material.needsUpdate = true;
    }

    this.updateTexture(src);
  },

  tick() {
    if (this.data.videoPaused || !this.video || !this.networkedEl || !NAF.utils.isMine(this.networkedEl)) return;

    const now = performance.now();
    if (now - this.lastUpdate > this.data.tickRate) {
      this.el.setAttribute("media-video", "time", this.video.currentTime);
      this.lastUpdate = now;
    }
  }
});

AFRAME.registerComponent("media-image", {
  schema: {
    src: { type: "string" },
    contentType: { type: "string" }
  },

  remove() {
    textureCache.release(this.data.src);
  },

  async update(oldData) {
    let texture;
    try {
      const { src, contentType } = this.data;
      if (!src) return;

      if (this.mesh && this.mesh.map) {
        this.mesh.material.map = null;
        this.mesh.material.needsUpdate = true;
        if (this.mesh.map !== errorTexture) {
          textureCache.release(oldData.src);
        }
      }

      if (textureCache.has(src)) {
        texture = textureCache.retain(src);
      } else {
        if (src === "error") {
          texture = errorTexture;
        } else if (contentType.includes("image/gif")) {
          texture = await createGIFTexture(src);
        } else if (contentType.startsWith("image/")) {
          texture = await createImageTexture(src);
        } else {
          throw new Error(`Unknown image content type: ${contentType}`);
        }

        textureCache.set(src, texture);

        // No way to cancel promises, so if src has changed while we were creating the texture just throw it away.
        if (this.data.src !== src) {
          textureCache.release(src);
          return;
        }
      }
    } catch (e) {
      console.error("Error loading image", this.data.src, e);
      texture = errorTexture;
    }

    if (!this.mesh) {
      this.mesh = createPlaneMesh(texture);
      this.el.setObject3D("mesh", this.mesh);
    } else {
      const { material } = this.mesh;
      material.map = texture;
      material.needsUpdate = true;
      this.mesh.needsUpdate = true;
    }

    fitToTexture(this.el, texture);

    this.el.emit("image-loaded");
  }
});
