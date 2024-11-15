import audioIcon from "../assets/images/audio.png";
import { paths } from "../systems/userinput/paths";
import HLS from "hls.js";
import {
  addAndArrangeMedia,
  createVideoOrAudioEl,
  createDashPlayer,
  createHLSPlayer,
  hasAudioTracks
} from "../utils/media-utils";
import { disposeTexture } from "../utils/material-utils";
import { SOUND_CAMERA_TOOL_TOOK_SNAPSHOT } from "../systems/sound-effects-system";
import { applyPersistentSync } from "../utils/permissions-utils";
import { refreshMediaMirror, getCurrentMirroredMedia } from "../utils/mirror-utils";
import { detect } from "detect-browser";
import semver from "semver";
import { createPlaneBufferGeometry } from "../utils/three-utils";
import HubsTextureLoader from "../loaders/HubsTextureLoader";
import { getCurrentAudioSettings, updateAudioSettings } from "../update-audio-settings";
import { SourceType, AudioType } from "./audio-params";
import { errorTexture } from "../utils/error-texture";
import { scaleToAspectRatio } from "../utils/scale-to-aspect-ratio";
import { isSafari } from "../utils/detect-safari";
import { isIOS as detectIOS } from "../utils/is-mobile";
import { Layers } from "../camera-layers";

const ONCE_TRUE = { once: true };
const TYPE_IMG_PNG = { type: "image/png" };

const isIOS = detectIOS();
const audioIconTexture = new HubsTextureLoader().load(audioIcon);

export const VOLUME_LABELS = [];
for (let i = 0; i <= 20; i++) {
  let s = "[";
  for (let j = 1; j <= 20; j++) {
    s += i >= j ? "|" : " ";
  }
  s += "]";
  VOLUME_LABELS[i] = s;
}

export function timeFmt(t) {
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

const MAX_GAIN_MULTIPLIER = 2;

AFRAME.registerComponent("media-video", {
  schema: {
    src: { type: "string" },
    audioSrc: { type: "string" }, // set only if audio track is separated from video track (eg. 360 video)
    contentType: { type: "string" },
    loop: { type: "boolean", default: true },
    hidePlaybackControls: { type: "boolean", default: false },
    videoPaused: { type: "boolean" },
    projection: { type: "string", default: "flat" },
    time: { type: "number" },
    tickRate: { default: 1000 }, // ms interval to send time interval updates
    syncTolerance: { default: 2 },
    linkedVideoTexture: { default: null },
    linkedAudioSource: { default: null },
    linkedMediaElementAudioSource: { default: null }
  },

  init() {
    APP.gainMultipliers.set(this.el, 1);
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
    this.setupAudio = this.setupAudio.bind(this);

    this.audioSystem = this.el.sceneEl.systems["hubs-systems"].audioSystem;

    this.lastUpdate = 0;
    this.videoMutedAt = 0;
    this.localSnapCount = 0;
    this.isSnapping = false;
    this.videoIsLive = null; // value null until we've determined if the video is live or not.
    this.onSnapImageLoaded = () => (this.isSnapping = false);
    this.hasAudioTracks = false;

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
      this.linkButton = this.el.querySelector(".video-link-button");

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

    let { disableLeftRightPanning, audioPanningQuality } = APP.store.state.preferences;
    this.onPreferenceChanged = () => {
      const newDisableLeftRightPanning = APP.store.state.preferences.disableLeftRightPanning;
      const newAudioPanningQuality = APP.store.state.preferences.audioPanningQuality;

      const shouldRecreateAudio =
        disableLeftRightPanning !== newDisableLeftRightPanning && this.audio && this.mediaElementAudioSource;
      const shouldUpdateAudioSettings = audioPanningQuality !== newAudioPanningQuality;

      disableLeftRightPanning = newDisableLeftRightPanning;
      audioPanningQuality = newAudioPanningQuality;

      if (shouldRecreateAudio) {
        this.setupAudio();
      } else if (shouldUpdateAudioSettings) {
        // updateAudioSettings() is called in this.setupAudio()
        // so no need to call it if shouldRecreateAudio is true.
        updateAudioSettings(this.el, this.audio);
      }
    };

    APP.store.addEventListener("statechanged", this.onPreferenceChanged);
    this.el.addEventListener("audio_type_changed", this.setupAudio);
  },

  play() {
    this.el.components["listed-media"] && this.el.sceneEl.emit("listed_media_changed");
  },

  isMineOrLocal() {
    return !this.el.components.networked || (this.networkedEl && NAF.utils.isMine(this.networkedEl));
  },

  ensureOwned() {
    return (
      !this.el.components.networked ||
      (this.networkedEl && NAF.utils.isMine(this.networkedEl)) ||
      NAF.utils.takeOwnership(this.networkedEl)
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
    let gainMultiplier = APP.gainMultipliers.get(this.el);
    gainMultiplier = THREE.MathUtils.clamp(gainMultiplier + v, 0, MAX_GAIN_MULTIPLIER);
    APP.gainMultipliers.set(this.el, gainMultiplier);
    this.updateVolumeLabel();
    const audio = APP.audios.get(this.el);
    if (audio) {
      updateAudioSettings(this.el, audio);
    }
  },

  volumeUp() {
    this.changeVolumeBy(0.2);
  },

  volumeDown() {
    this.changeVolumeBy(-0.2);
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
    if (this.video.paused) {
      APP.isAudioPaused.add(this.el);
    } else {
      APP.isAudioPaused.delete(this.el);
    }

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

  update(oldData) {
    this.updatePlaybackState();

    const shouldUpdateSrc = this.data.src && this.data.src !== oldData.src;
    if (shouldUpdateSrc) {
      this.updateSrc(oldData);
      return;
    }
  },

  setupAudio() {
    this.removeAudio();

    APP.sourceType.set(this.el, SourceType.MEDIA_VIDEO);

    if (this.data.videoPaused) {
      APP.isAudioPaused.add(this.el);
    } else {
      APP.isAudioPaused.delete(this.el);
    }

    const { audioType } = getCurrentAudioSettings(this.el);
    const audioListener = this.el.sceneEl.audioListener;
    if (audioType === AudioType.PannerNode) {
      this.audio = new THREE.PositionalAudio(audioListener);
    } else {
      this.audio = new THREE.Audio(audioListener);
    }
    // Default to being quiet so it fades in when volume is set by audio systems
    this.audio.gain.gain.value = 0;
    this.audioSystem.addAudio({ sourceType: SourceType.MEDIA_VIDEO, node: this.audio });

    this.audio.setNodeSource(this.mediaElementAudioSource);
    this.el.setObject3D("sound", this.audio);

    // Make sure that the audio is initialized to the right place.
    // Its matrix may not update if this element is not visible.
    // See https://github.com/Hubs-Foundation/hubs/issues/2855
    this.audio.updateMatrixWorld();

    APP.audios.set(this.el, this.audio);
    updateAudioSettings(this.el, this.audio);
    // Original audio source volume can now be restored as audio systems will take over
    this.mediaElementAudioSource.mediaElement.volume = 1;
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
        this.el.emit("video-loading");
        ({ texture, audioSourceEl } = await this.createVideoTextureAudioSourceEl());
        if (getCurrentMirroredMedia() === this.el) {
          await refreshMediaMirror();
        }
      }

      this.hasAudioTracks = hasAudioTracks(audioSourceEl);

      // No way to cancel promises, so if src has changed while we were creating the texture just throw it away.
      if (this.data.src !== src) {
        disposeTexture(texture);
        return;
      }

      this.mediaElementAudioSource = null;
      if (!src.startsWith("hubs://")) {
        // iOS video audio is broken on ios safari < 13.1.2, see: https://github.com/Hubs-Foundation/hubs/issues/1797
        if (!isIOS || semver.satisfies(detect().version, ">=13.1.2")) {
          // TODO FF error here if binding mediastream: The captured HTMLMediaElement is playing a MediaStream. Applying volume or mute status is not currently supported -- not an issue since we have no audio atm in shared video.
          this.mediaElementAudioSource =
            linkedMediaElementAudioSource ||
            this.el.sceneEl.audioListener.context.createMediaElementSource(audioSourceEl);

          this.hasAudioTracks && this.setupAudio();
        }
      }

      this.video = texture.image;
      this.video.loop = this.data.loop;
      this.video.addEventListener("pause", this.onPauseStateChange);
      this.video.addEventListener("play", this.onPauseStateChange);

      if (texture.hls) {
        const updateHLSLiveState = () => {
          if (texture.hls.currentLevel >= 0) {
            this.videoIsLive = texture.hls.levels[texture.hls.currentLevel].details.live;
            this.updateHoverMenu();
          }
        };
        texture.hls.on(HLS.Events.LEVEL_LOADED, updateHLSLiveState);
        texture.hls.on(HLS.Events.LEVEL_SWITCHED, updateHLSLiveState);
        if (texture.hls.currentLevel >= 0) {
          updateHLSLiveState();
        }
      } else {
        this.videoIsLive = this.video.duration === Infinity;
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
      material.toneMapped = false;

      let geometry;

      if (projection === "360-equirectangular") {
        geometry = new THREE.SphereBufferGeometry(1, 64, 32);
        // invert the geometry on the x-axis so that all of the faces point inward
        geometry.scale(-1, 1, 1);
      } else {
        const flipY = texture.isVideoTexture ? texture.flipY : audioIconTexture.flipY;
        geometry = createPlaneBufferGeometry(undefined, undefined, undefined, undefined, flipY);
        material.side = THREE.DoubleSide;
      }

      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.layers.set(Layers.CAMERA_LAYER_FX_MASK);
      this.el.setObject3D("mesh", this.mesh);
    }

    if (!texture.isVideoTexture) {
      this.mesh.material.map = audioIconTexture;
    } else {
      this.mesh.material.map = texture;
      if (projection === "flat") {
        scaleToAspectRatio(
          this.el,
          (texture.image.videoHeight || texture.image.height) / (texture.image.videoWidth || texture.image.width)
        );
      }
    }
    this.mesh.material.needsUpdate = true;

    this.updatePlaybackState(true);

    if (this.video && this.video.muted) {
      this.videoMutedAt = performance.now();
    }

    this.el.emit("video-loaded", { projection: projection });
  },

  async createVideoTextureAudioSourceEl() {
    const url = this.data.src;
    const contentType = this.data.contentType;
    let pollTimeout;

    /* eslint-disable-next-line no-async-promise-executor*/
    return new Promise(async (resolve, reject) => {
      if (this._audioSyncInterval) {
        clearInterval(this._audioSyncInterval);
        this._audioSyncInterval = null;
      }

      let resolved = false;
      const failLoad = function (e) {
        if (resolved) return;
        resolved = true;
        clearTimeout(pollTimeout);
        reject(e);
      };

      const videoEl = createVideoOrAudioEl("video");

      let texture, audioEl, isReady;
      if (contentType.startsWith("audio/")) {
        // We want to treat audio almost exactly like video, so we mock a video texture with an image property.
        texture = new THREE.Texture();
        texture.image = videoEl;
        isReady = () => videoEl.readyState > 0;
      } else {
        texture = new THREE.VideoTexture(videoEl);
        texture.minFilter = THREE.LinearFilter;
        texture.encoding = THREE.sRGBEncoding;

        isReady = () => {
          if (texture.hls && texture.hls.streamController.audioOnly) {
            audioEl = videoEl;
            const hls = texture.hls;
            texture = new THREE.Texture();
            texture.image = videoEl;
            texture.hls = hls;
            return true;
          } else {
            const ready =
              (texture.image.videoHeight || texture.image.height) && (texture.image.videoWidth || texture.image.width);
            return ready;
          }
        };
      }

      // Set src on video to begin loading.
      if (url.startsWith("hubs://")) {
        const streamClientId = url.substring(7).split("/")[1]; // /clients/<client id>/video is only URL for now
        const stream = await APP.dialog.getMediaStream(streamClientId, "video");
        // We subscribe to video stream notifications for this peer to update the video element
        // This could happen in case there is an ICE failure that requires a transport recreation.
        if (this._onStreamUpdated) {
          APP.dialog.off("stream_updated", this._onStreamUpdated);
        }
        this._onStreamUpdated = async (peerId, kind) => {
          if (peerId === streamClientId && kind === "video") {
            // The video stream for this peer has been updated
            const stream = await APP.dialog.getMediaStream(peerId, "video").catch(e => {
              console.error(`Error getting video stream for ${peerId}`, e);
            });
            if (stream) {
              videoEl.srcObject = new MediaStream(stream);
            }
          }
        };
        APP.dialog.on("stream_updated", this._onStreamUpdated, this);
        videoEl.srcObject = new MediaStream(stream.getVideoTracks());
        // If hls.js is supported we always use it as it gives us better events
      } else if (contentType.startsWith("application/dash")) {
        texture.dash = createDashPlayer(url, videoEl, failLoad);
      } else if (AFRAME.utils.material.isHLS(url, contentType)) {
        if (HLS.isSupported()) {
          if (texture.hls) {
            texture.hls.stopLoad();
            texture.hls.detachMedia();
            texture.hls.destroy();
            texture.hls = null;
          }
          texture.hls = createHLSPlayer(url, videoEl, failLoad);
        } else if (videoEl.canPlayType(contentType)) {
          videoEl.src = url;
          videoEl.onerror = failLoad;
        } else {
          failLoad("HLS unsupported");
        }
      } else {
        videoEl.src = url;

        // Workaround for Safari.
        // Safari seems to have a bug that it doesn't transfer range property in HTTP request header
        // for redirects if crossOrigin is set (while other major browsers do).
        // So Safari can fail to load video if the server responds redirect because
        // it expects 206 HTTP status code but gets 200.
        // If we fail to load video on Safari we retry with fetch() and videoEl.srcObject
        // which may avoid the problem.
        // Refer to #4516 for the details.
        if (isSafari()) {
          // There seems no way to detect whether the error is caused by the problem mentioned above.
          // So always retrying.
          videoEl.onerror = async () => {
            videoEl.onerror = failLoad;
            try {
              const res = await fetch(url);
              videoEl.srcObject = await res.blob();
            } catch (e) {
              failLoad(e);
            }
          };
        } else {
          videoEl.onerror = failLoad;
        }

        // audioSrc is non-empty only if audio track is separated from video track (eg. 360 video)
        if (this.data.audioSrc) {
          // Mute video track just in case
          videoEl.muted = true;

          // If there's an audio src, create an audio element to play it that we keep in sync
          // with the video while this component is active.
          audioEl = createVideoOrAudioEl("audio");
          audioEl.src = this.data.audioSrc;
          audioEl.onerror = failLoad;

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
          resolved = true;
          resolve({ texture, audioSourceEl: audioEl || texture.image });
        } else {
          pollTimeout = setTimeout(poll, 500);
        }
      };

      poll();
    });
  },

  updateHoverMenu() {
    if (!this.hoverMenu) return;

    const mediaLoader = this.el.components["media-loader"].data;
    const pinnableElement = mediaLoader.linkedEl || this.el;
    const isPinned = pinnableElement.components.pinnable && pinnableElement.components.pinnable.data.pinned;
    this.playbackControls.object3D.visible = !this.data.hidePlaybackControls && !!this.video;
    this.timeLabel.object3D.visible = !this.data.hidePlaybackControls;
    this.volumeLabel.object3D.visible =
      this.volumeUpButton.object3D.visible =
      this.volumeDownButton.object3D.visible =
        this.hasAudioTracks && !this.data.hidePlaybackControls && !!this.video;

    this.snapButton.object3D.visible =
      !!this.video && !this.data.contentType.startsWith("audio/") && window.APP.hubChannel.can("spawn_and_move_media");
    this.seekForwardButton.object3D.visible = !!this.video && !this.videoIsLive;

    const mayModifyPlayHead =
      !!this.video && !this.videoIsLive && (!isPinned || window.APP.hubChannel.can("pin_objects"));

    this.playPauseButton.object3D.visible =
      this.seekForwardButton.object3D.visible =
      this.seekBackButton.object3D.visible =
        mayModifyPlayHead;

    this.linkButton.object3D.visible = !!mediaLoader.mediaOptions.href;

    if (this.videoIsLive) {
      this.timeLabel.setAttribute("text", "value", "LIVE");
    }
  },

  updateVolumeLabel() {
    const gainMultiplier = APP.gainMultipliers.get(this.el);
    this.volumeLabel.setAttribute(
      "text",
      "value",
      gainMultiplier === 0 ? "MUTE" : VOLUME_LABELS[Math.floor(gainMultiplier / (MAX_GAIN_MULTIPLIER / 20))]
    );
  },

  tick: (() => {
    return function () {
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
    };
  })(),

  cleanUp() {
    if (this.videoTexture && !this.data.linkedVideoTexture) {
      disposeTexture(this.videoTexture);
    }
  },

  remove() {
    this.cleanUp();

    APP.isAudioPaused.delete(this.el);

    if (this.mesh) {
      this.el.removeObject3D("mesh");
    }

    if (this._audioSyncInterval) {
      clearInterval(this._audioSyncInterval);
      this._audioSyncInterval = null;
    }

    APP.gainMultipliers.delete(this.el);
    APP.audios.delete(this.el);
    APP.sourceType.delete(this.el);
    APP.supplementaryAttenuation.delete(this.el);

    this.removeAudio();

    if (this.networkedEl) {
      this.networkedEl.removeEventListener("pinned", this.updateHoverMenu);
      this.networkedEl.removeEventListener("unpinned", this.updateHoverMenu);
    }

    window.APP.hubChannel.removeEventListener("permissions_updated", this.updateHoverMenu);

    if (this.video) {
      this.video.removeEventListener("pause", this.onPauseStateChange);
      this.video.removeEventListener("play", this.onPauseStateChange);
      APP.dialog.off("stream_updated", this._onStreamUpdated);
    }

    if (this.hoverMenu) {
      this.playPauseButton.object3D.removeEventListener("interact", this.togglePlaying);
      this.volumeUpButton.object3D.removeEventListener("interact", this.volumeUp);
      this.volumeDownButton.object3D.removeEventListener("interact", this.volumeDown);
      this.seekForwardButton.object3D.removeEventListener("interact", this.seekForward);
      this.seekBackButton.object3D.removeEventListener("interact", this.seekBack);
      this.snapButton.object3D.removeEventListener("interact", this.snap);
    }

    window.APP.store.removeEventListener("statechanged", this.onPreferenceChanged);
    this.el.addEventListener("audio_type_changed", this.setupAudio);
  },

  removeAudio() {
    if (this.audio) {
      this.el.removeObject3D("sound");
      this.audioSystem.removeAudio({ node: this.audio });
      delete this.audio;
    }
  }
});
