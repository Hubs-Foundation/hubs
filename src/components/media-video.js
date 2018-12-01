import errorImageSrc from "!!url-loader!../assets/images/media-error.gif";
import { proxiedUrlFor, resolveUrl } from "../utils/media-utils";
import loadTexture from "../utils/loadTexture";

AFRAME.registerComponent("media-video", {
  schema: {
    src: { type: "string" },
    resolve: { type: "boolean", default: true },
    time: { type: "number" },
    videoPaused: { type: "boolean" },
    tickRate: { default: 1000 }, // ms interval to send time interval updates
    syncTolerance: { default: 2 }
  },

  init() {
    this.onGrabStart = this.onGrabStart.bind(this);
    this.onGrabEnd = this.onGrabEnd.bind(this);
    this.onPauseStateChange = this.onPauseStateChange.bind(this);

    const video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.preload = "auto";
    video.loop = true;
    video.crossOrigin = "anonymous";
    video.addEventListener("pause", this.onPauseStateChange);
    video.addEventListener("play", this.onPauseStateChange);
    this.video = video;

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.encoding = THREE.sRGBEncoding;
    this.videoTexture = videoTexture;

    const geometry = new THREE.PlaneGeometry();
    const material = new THREE.MeshBasicMaterial();
    material.map = videoTexture;
    material.side = THREE.DoubleSide;

    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    this.el.setObject3D("mesh", mesh);
    this.mesh = mesh;

    // from a-sound
    const sceneEl = this.el.sceneEl;
    sceneEl.audioListener = sceneEl.audioListener || new THREE.AudioListener();
    if (sceneEl.camera) {
      sceneEl.camera.add(sceneEl.audioListener);
    }
    sceneEl.addEventListener("camera-set-active", function(evt) {
      evt.detail.cameraEl.getObject3D("camera").add(sceneEl.audioListener);
    });

    // TODO FF error here if binding mediastream: The captured HTMLMediaElement is playing a MediaStream. Applying volume or mute status is not currently supported -- not an issue since we have no audio atm in shared video.
    const audioSource = this.el.sceneEl.audioListener.context.createMediaElementSource(this.video);
    const audio = new THREE.PositionalAudio(this.el.sceneEl.audioListener);
    audio.setNodeSource(audioSource);
    this.audio = audio;
    this.el.setObject3D("audio", audio);

    // Videos are not cached. Only used for caching the error texture.
    this.textureCache = this.el.sceneEl.systems["texture-cache"].cache;

    this.lastUpdate = 0;

    NAF.utils
      .getNetworkedEntity(this.el)
      .then(networkedEl => {
        this.networkedEl = networkedEl;
        this.updatePlaybackState();

        // For scene-owned videos, take ownership after a random delay if nobody
        // else has so there is a timekeeper.
        if (NAF.utils.getNetworkOwner(this.networkedEl) === "scene") {
          setTimeout(() => {
            if (NAF.utils.getNetworkOwner(this.networkedEl) === "scene") {
              NAF.utils.takeOwnership(this.networkedEl);
            }
          }, 2000 + Math.floor(Math.random() * 2000));
        }
      })
      .catch(console.error);
  },

  // aframe component play, unrelated to video
  play() {
    this.el.addEventListener("grab-start", this.onGrabStart);
    this.el.addEventListener("grab-end", this.onGrabEnd);
  },

  update(oldData) {
    const src = this.data.src;

    this.updatePlaybackState();

    if (src !== oldData.src) {
      // Asynchronously load and set the video.
      this.setVideo(src).catch(e => {
        console.error("Error loading video", src, e);
      });
    }
  },

  tick() {
    if (this.data.videoPaused || !this.video || !this.networkedEl || !NAF.utils.isMine(this.networkedEl)) return;

    const now = performance.now();
    if (now - this.lastUpdate > this.data.tickRate) {
      this.el.setAttribute("media-video", "time", this.video.currentTime);
      this.lastUpdate = now;
    }
  },

  // aframe component pause, unrelated to video
  pause() {
    this.el.removeEventListener("grab-start", this.onGrabStart);
    this.el.removeEventListener("grab-end", this.onGrabEnd);
  },

  remove() {
    this.mesh.material.dispose();
    this.video.removeEventListener("pause", this.onPauseStateChange);
    this.video.removeEventListener("play", this.onPauseStateChange);
  },

  onGrabStart() {
    if (!this.el.components.grabbable || this.el.components.grabbable.data.maxGrabbers === 0) return;
    this.grabStartPosition = this.el.object3D.position.clone();
  },

  onGrabEnd() {
    if (this.grabStartPosition && this.grabStartPosition.distanceToSquared(this.el.object3D.position) < 0.01 * 0.01) {
      this.togglePlayingIfOwner();
      this.grabStartPosition = null;
    }
  },

  togglePlayingIfOwner() {
    if (this.networkedEl && NAF.utils.isMine(this.networkedEl) && this.video) {
      this.tryUpdateVideoPlaybackState(!this.data.videoPaused);
    }
  },

  onPauseStateChange() {
    this.el.setAttribute("media-video", "videoPaused", this.video.paused);

    if (this.networkedEl && NAF.utils.isMine(this.networkedEl)) {
      this.el.emit("owned-video-state-changed");
    }
  },

  updatePlaybackState(force) {
    if (force || (this.networkedEl && !NAF.utils.isMine(this.networkedEl) && this.video)) {
      if (Math.abs(this.data.time - this.video.currentTime) > this.data.syncTolerance) {
        this.tryUpdateVideoPlaybackState(this.data.videoPaused, this.data.time);
      } else {
        this.tryUpdateVideoPlaybackState(this.data.videoPaused);
      }
    }
  },

  tryUpdateVideoPlaybackState(pause, currentTime) {
    if (this._playbackStateChangeTimeout) {
      clearTimeout(this._playbackStateChangeTimeout);
    }

    if (pause) {
      this.video.pause();

      if (currentTime) {
        this.video.currentTime = currentTime;
      }
    } else {
      // Need to deal with the fact play() may fail if user has not interacted with browser yet.
      this.video
        .play()
        .then(() => {
          if (currentTime) {
            this.video.currentTime = currentTime;
          }
        })
        .catch(() => {
          this._playbackStateChangeTimeout = setTimeout(
            () => this.tryUpdateVideoPlaybackState(pause, currentTime),
            1000
          );
        });
    }
  },

  async loadErrorTexture() {
    if (this.textureCache.has("error")) {
      return await this.textureCache.retain("error");
    }

    const pendingErrorTexture = loadTexture(errorImageSrc);
    this.textureCache.set("error", pendingErrorTexture);
    return await pendingErrorTexture;
  },

  async loadVideoTexture(src) {
    const video = this.video;
    const texture = this.videoTexture;

    if (src.startsWith("hubs://")) {
      const streamClientId = src.substring(7).split("/")[1]; // /clients/<client id>/video is only URL for now
      const stream = await NAF.connection.adapter.getMediaStream(streamClientId, "video");
      this.video.srcObject = new MediaStream(stream.getVideoTracks());
    } else {
      this.video.src = src;
    }

    // If iOS and video is HLS, do some hacks.
    if (
      AFRAME.utils.device.isIOS() &&
      AFRAME.utils.material.isHLS(video.src || video.getAttribute("src"), video.type || video.getAttribute("type"))
    ) {
      // Actually BGRA. Tell shader to correct later.
      texture.format = THREE.RGBAFormat;
      texture.needsCorrectionBGRA = true;
      // Apparently needed for HLS. Tell shader to correct later.
      texture.flipY = false;
      texture.needsCorrectionFlipY = true;
    }

    await new Promise((resolve, reject) => {
      let onLoad = null;
      let onError = null;

      const cleanup = () => {
        video.removeEventListener("loadedmetadata", onLoad);
        video.removeEventListener("error", onError);
      };

      onLoad = () => {
        resolve();
        cleanup();
      };

      onError = () => {
        reject();
        cleanup();
      };

      video.addEventListener("loadedmetadata", onLoad);
      video.addEventListener("error", onError);
    });

    return texture;
  },

  async loadTexture(src) {
    if (src === "error") {
      return await this.loadErrorTexture();
    }

    let accessibleUrl = src;

    // Resolve the image url / content type from the media API
    if (this.data.resolve) {
      const result = await resolveUrl(src);
      const canonicalUrl = result.origin;
      accessibleUrl = proxiedUrlFor(canonicalUrl);
    }

    return await this.loadVideoTexture(accessibleUrl);
  },

  async setVideo(src) {
    let texture;

    try {
      // Hide the video plane while it is loading.
      this.mesh.visible = false;
      this.video.src = "";

      this.el.setAttribute("loading-indicator", "");
      this.el.setAttribute("shape", {
        shape: "box",
        halfExtents: { x: 1, y: 1, z: 1 }
      });

      texture = await this.loadTexture(src);
    } catch (e) {
      texture = await this.loadTexture("error");
      throw e;
    } finally {
      // If the video changed while loading don't set it.
      if (src === this.data.src) {
        this.el.emit("video-loaded", { src: this.data.src });
        this.el.removeAttribute("loading-indicator");

        this.mesh.material.map = texture;
        texture.needsUpdate = true;
        this.mesh.material.needsUpdate = true;
        this.mesh.visible = true;

        // Scale the mesh to maintain the texture's aspect ratio.
        const ratio = (texture.image.videoHeight || 1.0) / (texture.image.videoWidth || 1.0);
        const width = Math.min(1.0, 1.0 / ratio);
        const height = Math.min(1.0, ratio);
        this.mesh.scale.set(width, height, 1);

        // Scale the box collider to fit the texture.
        this.el.setAttribute("shape", {
          shape: "box",
          halfExtents: { x: width / 2, y: height / 2, z: 0.05 }
        });

        this.updatePlaybackState(true);
      }
    }
  }
});
