/* global performance THREE AFRAME NAF MediaStream setTimeout */
import configs from "../utils/configs";
import GIFWorker from "../workers/gifparsing.worker.js";
import errorImageSrc from "!!url-loader!../assets/images/media-error.gif";
import audioIcon from "../assets/images/audio.png";
import { paths } from "../systems/userinput/paths";
import HLS from "hls.js";
import { addAndArrangeMedia, createImageTexture, createBasisTexture } from "../utils/media-utils";
import { proxiedUrlFor } from "../utils/media-url-utils";
import { buildAbsoluteURL } from "url-toolkit";
import { SOUND_CAMERA_TOOL_TOOK_SNAPSHOT } from "../systems/sound-effects-system";
import { promisifyWorker } from "../utils/promisify-worker.js";
import pdfjs from "pdfjs-dist";
import { applyPersistentSync } from "../utils/permissions-utils";
import { refreshMediaMirror, getCurrentMirroredMedia } from "../utils/mirror-utils";

// Using external CDN to reduce build size
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc =
    "https://assets-prod.reticulum.io/assets/js/pdfjs-dist@2.1.266/build/pdf.worker.js";
}

const ONCE_TRUE = { once: true };
const TYPE_IMG_PNG = { type: "image/png" };
const parseGIF = promisifyWorker(new GIFWorker());

const isIOS = AFRAME.utils.device.isIOS();
const isMobileVR = AFRAME.utils.device.isMobileVR();
const isFirefoxReality = isMobileVR && navigator.userAgent.match(/Firefox/);
const HLS_TIMEOUT = 10000; // HLS can sometimes fail, we re-try after this duration
const audioIconTexture = new THREE.TextureLoader().load(audioIcon);

export const VOLUME_LABELS = [];
for (let i = 0; i <= 20; i++) {
  let s = "[";
  for (let j = 1; j <= 20; j++) {
    s += i >= j ? "|" : " ";
  }
  s += "]";
  VOLUME_LABELS[i] = s;
}

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
    fetch(url, { mode: "cors" })
      .then(r => r.arrayBuffer())
      .then(rawImageData => parseGIF(rawImageData, [rawImageData]))
      .then(result => {
        const { frames, delayTimes, disposals } = result;
        let loadCnt = 0;
        for (let i = 0; i < frames.length; i++) {
          const img = new Image();
          img.onload = e => {
            loadCnt++;
            frames[i] = e.target;
            if (loadCnt === frames.length) {
              const texture = new GIFTexture(frames, delayTimes, disposals);
              texture.image.src = url;
              texture.encoding = THREE.sRGBEncoding;
              texture.minFilter = THREE.LinearFilter;
              resolve(texture);
            }
          };
          img.src = frames[i];
        }
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
function createVideoOrAudioEl(type) {
  const el = document.createElement(type);
  el.setAttribute("playsinline", "");
  el.setAttribute("webkit-playsinline", "");
  // iOS Safari requires the autoplay attribute, or it won't play the video at all.
  el.autoplay = true;
  // iOS Safari will not play videos without user interaction. We mute the video so that it can autoplay and then
  // allow the user to unmute it with an interaction in the unmute-video-button component.
  el.muted = isIOS;
  el.preload = "auto";
  el.crossOrigin = "anonymous";

  return el;
}

function scaleToAspectRatio(el, ratio) {
  const width = Math.min(1.0, 1.0 / ratio);
  const height = Math.min(1.0, ratio);
  el.object3DMap.mesh.scale.set(width, height, 1);
  el.object3DMap.mesh.matrixNeedsUpdate = true;
}

function disposeTexture(texture) {
  if (texture.image instanceof HTMLVideoElement) {
    const video = texture.image;
    video.pause();
    video.src = "";
    video.load();
  }

  if (texture.hls) {
    texture.hls.stopLoad();
    texture.hls.detachMedia();
    texture.hls.destroy();
    texture.hls = null;
  }

  texture.dispose();
}

class TextureCache {
  cache = new Map();

  key(src, version) {
    return `${src}_${version}`;
  }

  set(src, version, texture) {
    const image = texture.image;
    this.cache.set(this.key(src, version), {
      texture,
      ratio: (image.videoHeight || image.height) / (image.videoWidth || image.width),
      count: 0
    });
    return this.retain(src, version);
  }

  has(src, version) {
    return this.cache.has(this.key(src, version));
  }

  get(src, version) {
    return this.cache.get(this.key(src, version));
  }

  retain(src, version) {
    const cacheItem = this.cache.get(this.key(src, version));
    cacheItem.count++;
    // console.log("retain", src, cacheItem.count);
    return cacheItem;
  }

  release(src, version) {
    const cacheItem = this.cache.get(this.key(src, version));

    if (!cacheItem) {
      console.error(`Releasing uncached texture src ${src}`);
      return;
    }

    cacheItem.count--;
    // console.log("release", src, cacheItem.count);
    if (cacheItem.count <= 0) {
      // Unload the video element to prevent it from continuing to play in the background
      disposeTexture(cacheItem.texture);
      this.cache.delete(this.key(src, version));
    }
  }
}

const textureCache = new TextureCache();
const inflightTextures = new Map();

const errorImage = new Image();
errorImage.src = errorImageSrc;
const errorTexture = new THREE.Texture(errorImage);
errorTexture.magFilter = THREE.NearestFilter;
errorImage.onload = () => {
  errorTexture.needsUpdate = true;
};
const errorCacheItem = { texture: errorTexture, ratio: 1 };

function timeFmt(t) {
  let s = Math.floor(t),
    h = Math.floor(s / 3600);
  s -= h * 3600;
  let m = Math.floor(s / 60);
  s -= m * 60;
  if (h < 10) h = `0${h}`;
  if (m < 10) m = `0${m}`;
  if (s < 10) s = `0${s}`;
  return h === "00" ? `${m}:${s}` : `${h}:${m}:${s}`;
}

AFRAME.registerComponent("media-video", {
  schema: {
    src: { type: "string" },
    audioSrc: { type: "string" },
    contentType: { type: "string" },
    volume: { type: "number", default: 0.5 },
    loop: { type: "boolean", default: true },
    audioType: { type: "string", default: "pannernode" },
    hidePlaybackControls: { type: "boolean", default: false },
    distanceModel: { type: "string", default: "inverse" },
    rolloffFactor: { type: "number", default: 1 },
    refDistance: { type: "number", default: 1 },
    maxDistance: { type: "number", default: 10000 },
    coneInnerAngle: { type: "number", default: 360 },
    coneOuterAngle: { type: "number", default: 0 },
    coneOuterGain: { type: "number", default: 0 },
    videoPaused: { type: "boolean" },
    projection: { type: "string", default: "flat" },
    time: { type: "number" },
    tickRate: { default: 1000 }, // ms interval to send time interval updates
    syncTolerance: { default: 2 }
  },

  init() {
    this.onPauseStateChange = this.onPauseStateChange.bind(this);
    this.updateHoverMenu = this.updateHoverMenu.bind(this);
    this.tryUpdateVideoPlaybackState = this.tryUpdateVideoPlaybackState.bind(this);
    this.ensureOwned = this.ensureOwned.bind(this);
    this.isMineOrLocal = this.isMineOrLocal.bind(this);
    this.updateSrc = this.updateSrc.bind(this);

    this.seekForward = this.seekForward.bind(this);
    this.seekBack = this.seekBack.bind(this);
    this.volumeUp = this.volumeUp.bind(this);
    this.volumeDown = this.volumeDown.bind(this);
    this.snap = this.snap.bind(this);
    this.changeVolumeBy = this.changeVolumeBy.bind(this);
    this.togglePlaying = this.togglePlaying.bind(this);

    this.distanceBasedAttenuation = 1;

    this.lastUpdate = 0;
    this.videoMutedAt = 0;
    this.localSnapCount = 0;
    this.isSnapping = false;
    this.videoIsLive = null; // value null until we've determined if the video is live or not.
    this.onSnapImageLoaded = () => (this.isSnapping = false);

    this.el.setAttribute("hover-menu__video", { template: "#video-hover-menu", isFlat: true });
    this.el.components["hover-menu__video"].getHoverMenu().then(menu => {
      // If we got removed while waiting, do nothing.
      if (!this.el.parentNode) return;

      this.hoverMenu = menu;

      this.playbackControls = this.el.querySelector(".video-playback");
      this.playPauseButton = this.el.querySelector(".video-playpause-button");
      this.volumeUpButton = this.el.querySelector(".video-volume-up-button");
      this.volumeDownButton = this.el.querySelector(".video-volume-down-button");
      this.seekForwardButton = this.el.querySelector(".video-seek-forward-button");
      this.seekBackButton = this.el.querySelector(".video-seek-back-button");
      this.snapButton = this.el.querySelector(".video-snap-button");
      this.timeLabel = this.el.querySelector(".video-time-label");
      this.volumeLabel = this.el.querySelector(".video-volume-label");

      this.playPauseButton.object3D.addEventListener("interact", this.togglePlaying);
      this.seekForwardButton.object3D.addEventListener("interact", this.seekForward);
      this.seekBackButton.object3D.addEventListener("interact", this.seekBack);
      this.volumeUpButton.object3D.addEventListener("interact", this.volumeUp);
      this.volumeDownButton.object3D.addEventListener("interact", this.volumeDown);
      this.snapButton.object3D.addEventListener("interact", this.snap);

      this.updateVolumeLabel();
      this.updateHoverMenu();
      this.updatePlaybackState();
    });

    NAF.utils
      .getNetworkedEntity(this.el)
      .then(networkedEl => {
        this.networkedEl = networkedEl;
        applyPersistentSync(this.networkedEl.components.networked.data.networkId);
        this.updatePlaybackState();

        this.networkedEl.addEventListener("pinned", this.updateHoverMenu);
        this.networkedEl.addEventListener("unpinned", this.updateHoverMenu);
        window.APP.hubChannel.addEventListener("permissions_updated", this.updateHoverMenu);

        // For scene-owned videos, take ownership after a random delay if nobody
        // else has so there is a timekeeper. Do not due this on iOS because iOS has an
        // annoying "auto-pause" feature that forces one non-autoplaying video to play
        // at once, which will pause the videos for everyone in the room if owned.
        if (!isIOS && NAF.utils.getNetworkOwner(this.networkedEl) === "scene") {
          setTimeout(() => {
            if (NAF.utils.getNetworkOwner(this.networkedEl) === "scene") {
              NAF.utils.takeOwnership(this.networkedEl);
            }
          }, 2000 + Math.floor(Math.random() * 2000));
        }
      })
      .catch(() => {
        // Non-networked
        this.updatePlaybackState();
      });

    // from a-sound
    const sceneEl = this.el.sceneEl;
    sceneEl.audioListener = sceneEl.audioListener || new THREE.AudioListener();
    if (sceneEl.camera) {
      sceneEl.camera.add(sceneEl.audioListener);
    }
    sceneEl.addEventListener("camera-set-active", function(evt) {
      evt.detail.cameraEl.getObject3D("camera").add(sceneEl.audioListener);
    });
  },

  isMineOrLocal() {
    return !this.el.components.networked || (this.networkedEl && NAF.utils.isMine(this.networkedEl));
  },

  ensureOwned() {
    return (
      !this.el.components.networked ||
      ((this.networkedEl && NAF.utils.isMine(this.networkedEl)) || NAF.utils.takeOwnership(this.networkedEl))
    );
  },

  seekForward() {
    if (!this.videoIsLive && this.ensureOwned()) {
      this.video.currentTime += 30;
      this.el.setAttribute("media-video", "time", this.video.currentTime);
    }
  },

  seekBack() {
    if (!this.videoIsLive && this.ensureOwned()) {
      this.video.currentTime -= 10;
      this.el.setAttribute("media-video", "time", this.video.currentTime);
    }
  },

  changeVolumeBy(v) {
    this.el.setAttribute("media-video", "volume", THREE.Math.clamp(this.data.volume + v, 0, 1));
    this.updateVolumeLabel();
  },

  volumeUp() {
    this.changeVolumeBy(0.1);
  },

  volumeDown() {
    this.changeVolumeBy(-0.1);
  },

  async snap() {
    if (this.isSnapping) return;
    this.isSnapping = true;
    this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CAMERA_TOOL_TOOK_SNAPSHOT);

    const canvas = document.createElement("canvas");
    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;
    canvas.getContext("2d").drawImage(this.video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve));
    const file = new File([blob], "snap.png", TYPE_IMG_PNG);

    this.localSnapCount++;
    const { entity } = addAndArrangeMedia(this.el, file, "photo-snapshot", this.localSnapCount);
    entity.addEventListener("image-loaded", this.onSnapImageLoaded, ONCE_TRUE);
  },

  togglePlaying() {
    // See onPauseStateChanged for note about iOS
    if (isIOS && this.video.paused && this.isMineOrLocal()) {
      this.video.play();
      return;
    }

    if (this.ensureOwned()) {
      this.tryUpdateVideoPlaybackState(!this.data.videoPaused);
    }
  },

  onPauseStateChange() {
    // iOS Safari will auto-pause other videos if one is manually started (not autoplayed.) So, to keep things
    // easy to reason about, we *never* broadcast pauses from iOS.
    //
    // if an iOS safari user pauses and plays a video they'll pause all the other videos,
    // which isn't great, but this check will at least ensure they don't pause those videos
    // for all other users in the room! Of course, if they go and hit play on those videos auto-paused,
    // they will become the timekeeper, and will seek everyone to where the video was auto-paused.
    //
    // This specific case will diverge the network schema and the video player state, so that
    // this.data.videoPaused is false (so others will keep playing it) but our local player will
    // have stopped. So we deal with this special case as well when we press the play button.
    if (isIOS && this.video.paused && this.isMineOrLocal()) {
      return;
    }

    // Used in the HACK in hub.js for dealing with auto-pause in Oculus Browser
    if (this._ignorePauseStateChanges) return;

    this.el.setAttribute("media-video", "videoPaused", this.video.paused);

    if (this.networkedEl && NAF.utils.isMine(this.networkedEl)) {
      this.el.emit("owned-video-state-changed");
    }
  },

  updatePlaybackState(force) {
    this.updateHoverMenu();

    // Only update playback position for videos you don't own
    if (this.video && (force || (this.networkedEl && !NAF.utils.isMine(this.networkedEl)))) {
      if (Math.abs(this.data.time - this.video.currentTime) > this.data.syncTolerance) {
        this.tryUpdateVideoPlaybackState(this.data.videoPaused, this.data.time);
      } else {
        this.tryUpdateVideoPlaybackState(this.data.videoPaused);
      }
    }

    // Volume is local, always update it
    if (this.audio && window.APP.store.state.preferences.audioOutputMode !== "audio") {
      const globalMediaVolume =
        window.APP.store.state.preferences.globalMediaVolume !== undefined
          ? window.APP.store.state.preferences.globalMediaVolume
          : 100;
      this.audio.gain.gain.value = (globalMediaVolume / 100) * this.data.volume;
    }
  },

  tryUpdateVideoPlaybackState(pause, currentTime) {
    if (this._playbackStateChangeTimeout) {
      clearTimeout(this._playbackStateChangeTimeout);
      delete this._playbackStateChangeTimeout;
    }

    // Update current time if we've determined this video is not a live stream, since otherwise we may
    // update the video to currentTime = 0
    if (this.videoIsLive === false && currentTime !== undefined) {
      this.video.currentTime = currentTime;
    }

    if (this.hoverMenu) {
      this.playPauseButton.setAttribute("icon-button", "active", pause);
    }

    if (pause) {
      this.video.pause();
    } else {
      // Need to deal with the fact play() may fail if user has not interacted with browser yet.
      this.video.play().catch(() => {
        if (pause !== this.data.videoPaused) return;
        this._playbackStateChangeTimeout = setTimeout(() => this.tryUpdateVideoPlaybackState(pause, currentTime), 1000);
      });
    }
  },

  async update(oldData) {
    const src = this.data.src;
    this.updatePlaybackState();

    if (!src || src === oldData.src) return;
    return this.updateSrc(oldData);
  },

  setupAudio() {
    if (this.audio) {
      this.audio.disconnect();
      this.el.removeObject3D("sound");
    }

    if (this.data.audioType === "pannernode") {
      this.audio = new THREE.PositionalAudio(this.el.sceneEl.audioListener);
      this.setPositionalAudioProperties();
      this.distanceBasedAttenuation = 1;
    } else {
      this.audio = new THREE.Audio(this.el.sceneEl.audioListener);
    }
    window.foo = this.audio;

    this.audio.setNodeSource(this.mediaElementAudioSource);
    this.el.setObject3D("sound", this.audio);
  },

  setPositionalAudioProperties() {
    this.audio.setDistanceModel(this.data.distanceModel);
    this.audio.setRolloffFactor(this.data.rolloffFactor);
    this.audio.setRefDistance(this.data.refDistance);
    this.audio.setMaxDistance(this.data.maxDistance);
    this.audio.panner.coneInnerAngle = this.data.coneInnerAngle;
    this.audio.panner.coneOuterAngle = this.data.coneOuterAngle;
    this.audio.panner.coneOuterGain = this.data.coneOuterGain;
  },

  async updateSrc(oldData) {
    const { src, linkedVideoTexture, linkedAudioSource, linkedMediaElementAudioSource } = this.data;

    this.cleanUp();
    if (this.mesh && this.mesh.material) {
      this.mesh.material.map = null;
      this.mesh.material.needsUpdate = true;
    }

    let texture, audioSourceEl;
    try {
      if (linkedVideoTexture) {
        texture = linkedVideoTexture;
        audioSourceEl = linkedAudioSource;
      } else {
        ({ texture, audioSourceEl } = await this.createVideoTextureAudioSourceEl());
        if (getCurrentMirroredMedia() === this.el) {
          await refreshMediaMirror();
        }
      }

      // No way to cancel promises, so if src has changed while we were creating the texture just throw it away.
      if (this.data.src !== src) {
        disposeTexture(texture);
        return;
      }

      this.mediaElementAudioSource = null;

      if (!src.startsWith("hubs://")) {
        // iOS video audio is broken, see: https://github.com/mozilla/hubs/issues/1797
        if (!isIOS) {
          // TODO FF error here if binding mediastream: The captured HTMLMediaElement is playing a MediaStream. Applying volume or mute status is not currently supported -- not an issue since we have no audio atm in shared video.
          this.mediaElementAudioSource =
            linkedMediaElementAudioSource ||
            this.el.sceneEl.audioListener.context.createMediaElementSource(audioSourceEl);

          const audioOutputMode = window.APP.store.state.preferences.audioOutputMode === "audio" ? "audio" : "panner";
          this.data.audioType = audioOutputMode === "panner" ? "pannernode" : "audionode";
          this.setupAudio();
        }
      }

      this.video = texture.image;
      this.video.loop = this.data.loop;
      this.video.addEventListener("pause", this.onPauseStateChange);
      this.video.addEventListener("play", this.onPauseStateChange);

      if (texture.hls) {
        const updateLiveState = () => {
          if (texture.hls.currentLevel >= 0) {
            const videoWasLive = !!this.videoIsLive;
            this.videoIsLive = texture.hls.levels[texture.hls.currentLevel].details.live;
            this.updateHoverMenu();

            if (!videoWasLive && this.videoIsLive) {
              this.el.emit("video_is_live_update", { videoIsLive: this.videoIsLive });
              // We just determined the video is live (there can be a delay due to autoplay issues, etc)
              // so catch it up to HEAD.
              if (!isFirefoxReality) {
                // HACK this causes live streams to freeze in FxR due to https://github.com/MozillaReality/FirefoxReality/issues/1602, TODO remove once 1.4 ships
                this.video.currentTime = this.video.duration - 0.01;
              }
            }
          }
        };
        texture.hls.on(HLS.Events.LEVEL_LOADED, updateLiveState);
        texture.hls.on(HLS.Events.LEVEL_SWITCHED, updateLiveState);
        if (texture.hls.currentLevel >= 0) {
          updateLiveState();
        }
      } else {
        this.videoIsLive = this.video.duration === Infinity;
        this.el.emit("video_is_live_update", { videoIsLive: this.videoIsLive });
        this.updateHoverMenu();
      }

      if (isIOS) {
        const template = document.getElementById("video-unmute");
        this.el.appendChild(document.importNode(template.content, true));
        this.el.setAttribute("position-at-border__unmute-ui", {
          target: ".unmute-ui",
          isFlat: true
        });
      }

      this.videoTexture = texture;
      this.audioSource = audioSourceEl;
    } catch (e) {
      console.error("Error loading video", this.data.src, e);
      texture = errorTexture;
      this.videoTexture = this.audioSource = null;
    }

    const projection = this.data.projection;

    if (!this.mesh || projection !== oldData.projection) {
      const material = new THREE.MeshBasicMaterial();

      let geometry;

      if (projection === "360-equirectangular") {
        geometry = new THREE.SphereBufferGeometry(1, 64, 32);
        // invert the geometry on the x-axis so that all of the faces point inward
        geometry.scale(-1, 1, 1);
      } else {
        geometry = new THREE.PlaneBufferGeometry();
        material.side = THREE.DoubleSide;
      }

      this.mesh = new THREE.Mesh(geometry, material);
      this.el.setObject3D("mesh", this.mesh);
    }

    if (this.data.contentType.startsWith("audio/")) {
      this.mesh.material.map = audioIconTexture;
    } else {
      this.mesh.material.map = texture;
    }
    this.mesh.material.needsUpdate = true;

    if (projection === "flat" && !this.data.contentType.startsWith("audio/")) {
      scaleToAspectRatio(
        this.el,
        (texture.image.videoHeight || texture.image.height) / (texture.image.videoWidth || texture.image.width)
      );
    }

    this.updatePlaybackState(true);

    if (this.video && this.video.muted) {
      this.videoMutedAt = performance.now();
    }

    this.el.emit("video-loaded", { projection: projection });
  },

  async createVideoTextureAudioSourceEl() {
    const url = this.data.src;
    const contentType = this.data.contentType;

    return new Promise(async (resolve, reject) => {
      if (this._audioSyncInterval) {
        clearInterval(this._audioSyncInterval);
        this._audioSyncInterval = null;
      }

      const videoEl = createVideoOrAudioEl("video");

      let texture, audioEl, isReady;
      if (contentType.startsWith("audio/")) {
        // We want to treat audio almost exactly like video, so we mock a video texture with an image property.
        texture = new THREE.Texture();
        texture.image = videoEl;
        isReady = () => true;
      } else {
        texture = new THREE.VideoTexture(videoEl);
        texture.minFilter = THREE.LinearFilter;
        texture.encoding = THREE.sRGBEncoding;
        isReady = () =>
          (texture.image.videoHeight || texture.image.height) && (texture.image.videoWidth || texture.image.width);
      }

      // Set src on video to begin loading.
      if (url.startsWith("hubs://")) {
        const streamClientId = url.substring(7).split("/")[1]; // /clients/<client id>/video is only URL for now
        const stream = await NAF.connection.adapter.getMediaStream(streamClientId, "video");
        videoEl.srcObject = new MediaStream(stream.getVideoTracks());
        // If hls.js is supported we always use it as it gives us better events
      } else if (AFRAME.utils.material.isHLS(url, contentType)) {
        if (HLS.isSupported()) {
          const corsProxyPrefix = `https://${configs.CORS_PROXY_SERVER}/`;
          const baseUrl = url.startsWith(corsProxyPrefix) ? url.substring(corsProxyPrefix.length) : url;
          const setupHls = () => {
            if (texture.hls) {
              texture.hls.stopLoad();
              texture.hls.detachMedia();
              texture.hls.destroy();
              texture.hls = null;
            }

            const hls = new HLS({
              xhrSetup: (xhr, u) => {
                if (u.startsWith(corsProxyPrefix)) {
                  u = u.substring(corsProxyPrefix.length);
                }

                // HACK HLS.js resolves relative urls internally, but our CORS proxying screws it up. Resolve relative to the original unproxied url.
                // TODO extend HLS.js to allow overriding of its internal resolving instead
                if (!u.startsWith("http")) {
                  u = buildAbsoluteURL(baseUrl, u.startsWith("/") ? u : `/${u}`);
                }

                xhr.open("GET", proxiedUrlFor(u));
              }
            });

            texture.hls = hls;
            hls.loadSource(url);
            hls.attachMedia(videoEl);

            hls.on(HLS.Events.ERROR, function(event, data) {
              if (data.fatal) {
                switch (data.type) {
                  case HLS.ErrorTypes.NETWORK_ERROR:
                    // try to recover network error
                    hls.startLoad();
                    break;
                  case HLS.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
                  default:
                    reject(event);
                    return;
                }
              }
            });
          };

          setupHls();

          // Sometimes for weird streams HLS fails to initialize.
          const setupInterval = setInterval(() => {
            // Stop retrying if the src changed.
            const isNoLongerSrc = this.data.src !== url;

            if (isReady() || isNoLongerSrc) {
              clearInterval(setupInterval);
            } else {
              console.warn("HLS failed to read video, trying again");
              setupHls();
            }
          }, HLS_TIMEOUT);
          // If not, see if native support will work
        } else if (videoEl.canPlayType(contentType)) {
          videoEl.src = url;
          videoEl.onerror = reject;
        } else {
          reject("HLS unsupported");
        }
      } else {
        videoEl.src = url;
        videoEl.onerror = reject;

        if (this.data.audioSrc) {
          // If there's an audio src, create an audio element to play it that we keep in sync
          // with the video while this component is active.
          audioEl = createVideoOrAudioEl("audio");
          audioEl.src = this.data.audioSrc;
          audioEl.onerror = reject;

          this._audioSyncInterval = setInterval(() => {
            if (Math.abs(audioEl.currentTime - videoEl.currentTime) >= 0.33) {
              // In Chrome, drift of a few frames seems persistent
              audioEl.currentTime = videoEl.currentTime;
            }

            // During pause state change, correct any drift that remains.
            if (videoEl.paused !== audioEl.paused) {
              videoEl.paused ? audioEl.pause() : audioEl.play();
              audioEl.currentTime = videoEl.currentTime;
            }
          }, 1000);
        }
      }

      // NOTE: We used to use the canplay event here to yield the texture, but that fails to fire on iOS Safari
      // and also sometimes in Chrome it seems.
      const poll = () => {
        if (isReady()) {
          resolve({ texture, audioSourceEl: audioEl || texture.image });
        } else {
          setTimeout(poll, 500);
        }
      };

      poll();
    });
  },

  updateHoverMenu() {
    if (!this.hoverMenu) return;

    const pinnableElement = this.el.components["media-loader"].data.linkedEl || this.el;
    const isPinned = pinnableElement.components.pinnable && pinnableElement.components.pinnable.data.pinned;
    this.playbackControls.object3D.visible = !this.data.hidePlaybackControls && !!this.video;
    this.timeLabel.object3D.visible = !this.data.hidePlaybackControls;

    this.snapButton.object3D.visible =
      !!this.video && !this.data.contentType.startsWith("audio/") && window.APP.hubChannel.can("spawn_and_move_media");
    this.seekForwardButton.object3D.visible = !!this.video && !this.videoIsLive;

    const mayModifyPlayHead =
      !!this.video && !this.videoIsLive && (!isPinned || window.APP.hubChannel.can("pin_objects"));

    this.playPauseButton.object3D.visible = this.seekForwardButton.object3D.visible = this.seekBackButton.object3D.visible = mayModifyPlayHead;

    if (this.videoIsLive) {
      this.timeLabel.setAttribute("text", "value", "LIVE");
    }
  },

  updateVolumeLabel() {
    this.volumeLabel.setAttribute(
      "text",
      "value",
      this.data.volume === 0 ? "MUTE" : VOLUME_LABELS[Math.floor(this.data.volume / 0.05)]
    );
  },

  tick: (() => {
    const positionA = new THREE.Vector3();
    const positionB = new THREE.Vector3();
    return function() {
      if (!this.video) return;

      const userinput = this.el.sceneEl.systems.userinput;
      const interaction = this.el.sceneEl.systems.interaction;
      const volumeModRight = userinput.get(paths.actions.cursor.right.mediaVolumeMod);
      if (interaction.state.rightRemote.hovered === this.el && volumeModRight) {
        this.changeVolumeBy(volumeModRight);
      }
      const volumeModLeft = userinput.get(paths.actions.cursor.left.mediaVolumeMod);
      if (interaction.state.leftRemote.hovered === this.el && volumeModLeft) {
        this.changeVolumeBy(volumeModLeft);
      }

      const isHeld = interaction.isHeld(this.el);

      if (this.wasHeld && !isHeld) {
        this.localSnapCount = 0;
      }

      this.wasHeld = isHeld;

      if (this.hoverMenu && this.hoverMenu.object3D.visible && !this.videoIsLive) {
        this.timeLabel.setAttribute(
          "text",
          "value",
          `${timeFmt(this.video.currentTime)} / ${timeFmt(this.video.duration)}`
        );
      }

      // If a known non-live video is currently playing and we own it, send out time updates
      if (
        !this.data.videoPaused &&
        this.videoIsLive === false &&
        this.networkedEl &&
        NAF.utils.isMine(this.networkedEl)
      ) {
        const now = performance.now();
        if (now - this.lastUpdate > this.data.tickRate) {
          this.el.setAttribute("media-video", "time", this.video.currentTime);
          this.lastUpdate = now;
        }
      }

      if (this.audio) {
        const audioOutputMode = window.APP.store.state.preferences.audioOutputMode === "audio" ? "audio" : "panner";
        if (
          (audioOutputMode === "panner" && this.data.audioType !== "pannernode") ||
          (audioOutputMode === "audio" && this.data.audioType !== "audionode")
        ) {
          this.data.audioType = audioOutputMode === "panner" ? "pannernode" : "audionode";
          this.setupAudio();
        }

        if (audioOutputMode === "audio") {
          this.el.object3D.getWorldPosition(positionA);
          this.el.sceneEl.camera.getWorldPosition(positionB);
          const distance = positionA.distanceTo(positionB);
          this.distanceBasedAttenuation = Math.min(1, 10 / Math.max(1, distance * distance));
          const globalMediaVolume =
            window.APP.store.state.preferences.globalMediaVolume !== undefined
              ? window.APP.store.state.preferences.globalMediaVolume
              : 100;
          this.audio.gain.gain.value = (globalMediaVolume / 100) * this.data.volume * this.distanceBasedAttenuation;
        }
      }
    };
  })(),

  cleanUp() {
    if (this.mesh && this.mesh.material) {
      if (!this.data.linkedVideoTexture) {
        disposeTexture(this.mesh.material.map);
      }
    }
  },

  remove() {
    this.cleanUp();

    if (this.mesh) {
      this.el.removeObject3D("mesh");
    }

    if (this._audioSyncInterval) {
      clearInterval(this._audioSyncInterval);
      this._audioSyncInterval = null;
    }

    if (this.audio) {
      this.el.removeObject3D("sound");
      this.audio.disconnect();
      delete this.audio;
    }

    if (this.networkedEl) {
      this.networkedEl.removeEventListener("pinned", this.updateHoverMenu);
      this.networkedEl.removeEventListener("unpinned", this.updateHoverMenu);
    }

    window.APP.hubChannel.removeEventListener("permissions_updated", this.updateHoverMenu);

    if (this.video) {
      this.video.removeEventListener("pause", this.onPauseStateChange);
      this.video.removeEventListener("play", this.onPauseStateChange);
    }

    if (this.hoverMenu) {
      this.playPauseButton.object3D.removeEventListener("interact", this.togglePlaying);
      this.volumeUpButton.object3D.removeEventListener("interact", this.volumeUp);
      this.volumeDownButton.object3D.removeEventListener("interact", this.volumeDown);
      this.seekForwardButton.object3D.removeEventListener("interact", this.seekForward);
      this.seekBackButton.object3D.removeEventListener("interact", this.seekBack);
    }
  }
});

AFRAME.registerComponent("media-image", {
  schema: {
    src: { type: "string" },
    version: { type: "number" },
    projection: { type: "string", default: "flat" },
    contentType: { type: "string" },
    batch: { default: false }
  },

  remove() {
    if (this.data.batch && this.mesh) {
      this.el.sceneEl.systems["hubs-systems"].batchManagerSystem.removeObject(this.mesh);
    }
    if (this.currentSrcIsRetained) {
      textureCache.release(this.data.src, this.data.version);
      this.currentSrcIsRetained = false;
    }
  },

  async update(oldData) {
    let texture;
    let ratio = 1;

    const batchManagerSystem = this.el.sceneEl.systems["hubs-systems"].batchManagerSystem;

    try {
      const { src, version, contentType } = this.data;
      if (!src) return;

      this.el.emit("image-loading");

      if (this.mesh && this.mesh.material.map && (src !== oldData.src || version !== oldData.version)) {
        this.mesh.material.map = null;
        this.mesh.material.needsUpdate = true;
        if (this.mesh.material.map !== errorTexture) {
          textureCache.release(oldData.src, oldData.version);
          this.currentSrcIsRetained = false;
        }
      }

      let cacheItem;
      if (textureCache.has(src, version)) {
        if (this.currentSrcIsRetained) {
          cacheItem = textureCache.get(src, version);
        } else {
          cacheItem = textureCache.retain(src, version);
        }
      } else {
        const inflightKey = textureCache.key(src, version);

        if (src === "error") {
          cacheItem = errorCacheItem;
        } else if (inflightTextures.has(inflightKey)) {
          await inflightTextures.get(inflightKey);
          cacheItem = textureCache.retain(src, version);
        } else {
          let promise;
          if (contentType.includes("image/gif")) {
            promise = createGIFTexture(src);
          } else if (contentType.includes("image/basis")) {
            promise = createBasisTexture(src);
          } else if (contentType.startsWith("image/")) {
            promise = createImageTexture(src);
          } else {
            throw new Error(`Unknown image content type: ${contentType}`);
          }
          inflightTextures.set(inflightKey, promise);
          texture = await promise;
          inflightTextures.delete(inflightKey);
          cacheItem = textureCache.set(src, version, texture);
        }

        // No way to cancel promises, so if src has changed or this entity was removed while we were creating the texture just throw it away.
        if (this.data.src !== src || this.data.version !== version || !this.el.parentNode) {
          textureCache.release(src, version);
          return;
        }
      }

      texture = cacheItem.texture;
      ratio = cacheItem.ratio;

      this.currentSrcIsRetained = true;
    } catch (e) {
      console.error("Error loading image", this.data.src, e);
      texture = errorTexture;
      this.currentSrcIsRetained = false;
    }

    const projection = this.data.projection;

    if (this.mesh && this.data.batch) {
      // This is a no-op if the mesh was just created.
      // Otherwise we want to ensure the texture gets updated.
      batchManagerSystem.removeObject(this.mesh);
    }

    if (!this.mesh || projection !== oldData.projection) {
      const material = new THREE.MeshBasicMaterial();

      let geometry;

      if (projection === "360-equirectangular") {
        geometry = new THREE.SphereBufferGeometry(1, 64, 32);
        // invert the geometry on the x-axis so that all of the faces point inward
        geometry.scale(-1, 1, 1);

        // Flip uvs on the geometry
        if (!texture.flipY) {
          const uvs = geometry.attributes.uv.array;

          for (let i = 1; i < uvs.length; i += 2) {
            uvs[i] = 1 - uvs[i];
          }
        }
      } else {
        geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1, texture.flipY);
        material.side = THREE.DoubleSide;
      }

      this.mesh = new THREE.Mesh(geometry, material);
      this.el.setObject3D("mesh", this.mesh);
    }

    // We only support transparency on gifs. Other images will support cutout as part of batching, but not alpha transparency for now
    this.mesh.material.transparent =
      !this.data.batch ||
      texture == errorTexture ||
      this.data.contentType.includes("image/gif") ||
      (texture.image && texture.image.hasAlpha);

    this.mesh.material.map = texture;
    this.mesh.material.needsUpdate = true;

    if (projection === "flat") {
      scaleToAspectRatio(this.el, ratio);
    }

    if (texture !== errorTexture && this.data.batch && !texture.isCompressedTexture) {
      batchManagerSystem.addObject(this.mesh);
    }

    this.el.emit("image-loaded", { src: this.data.src, projection: projection });
  }
});

AFRAME.registerComponent("media-pdf", {
  schema: {
    src: { type: "string" },
    projection: { type: "string", default: "flat" },
    contentType: { type: "string" },
    index: { default: 0 },
    batch: { default: false }
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

  remove() {
    if (this.data.batch && this.mesh) {
      this.el.sceneEl.systems["hubs-systems"].batchManagerSystem.removeObject(this.mesh);
    }
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

      this.currentPageTextureIsRetained = true;
    } catch (e) {
      console.error("Error loading PDF", this.data.src, e);
      texture = errorTexture;
    }

    if (!this.mesh) {
      const material = new THREE.MeshBasicMaterial();
      const geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1, texture.flipY);
      material.side = THREE.DoubleSide;

      this.mesh = new THREE.Mesh(geometry, material);
      this.el.setObject3D("mesh", this.mesh);
    }

    this.mesh.material.transparent = texture == errorTexture;
    this.mesh.material.map = texture;
    this.mesh.material.map.needsUpdate = true;
    this.mesh.material.needsUpdate = true;

    scaleToAspectRatio(this.el, ratio);

    if (texture !== errorTexture && this.data.batch) {
      this.el.sceneEl.systems["hubs-systems"].batchManagerSystem.addObject(this.mesh);
    }

    if (this.el.components["media-pager"] && this.el.components["media-pager"].data.index !== this.data.index) {
      this.el.setAttribute("media-pager", { index: this.data.index });
    }

    this.el.emit("pdf-loaded", { src: this.data.src });
  }
});
