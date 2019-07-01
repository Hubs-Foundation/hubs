import { spawnMediaAround } from "../utils/media-utils";
import { createImageBitmap } from "../utils/image-bitmap-utils";
import { ObjectTypes } from "../object-types";
import { paths } from "../systems/userinput/paths";
import { detect } from "detect-browser";
import { SOUND_CAMERA_TOOL_TOOK_SNAPSHOT, SOUND_CAMERA_TOOL_COUNTDOWN } from "../systems/sound-effects-system";
import { getAudioFeedbackScale } from "./audio-feedback";
import * as ebml from "ts-ebml";

import cameraModelSrc from "../assets/camera_tool.glb";

const cameraModelPromise = new Promise(resolve => new THREE.GLTFLoader().load(cameraModelSrc, resolve));
const browser = detect();

const pathsMap = {
  "player-right-controller": {
    takeSnapshot: paths.actions.rightHand.takeSnapshot
  },
  "player-left-controller": {
    takeSnapshot: paths.actions.leftHand.takeSnapshot
  },
  cursor: {
    takeSnapshot: paths.actions.cursor.takeSnapshot
  }
};

const isMobileVR = AFRAME.utils.device.isMobileVR();
const isOculusBrowser = navigator.userAgent.match(/Oculus/);

const VIEWPORT_FPS = 6;
const VIDEO_FPS = 25;
// Prefer h264 if available due to faster decoding speec on most platforms
const videoCodec = ["h264", "vp9", "vp8"].find(codec => MediaRecorder.isTypeSupported(`video/webm; codecs=${codec}`));
const videoMimeType = videoCodec ? `video/webm; codecs=${videoCodec}` : null;
const allowVideo = !!videoMimeType && !isOculusBrowser; // Disable Oculus Browser until h264/vp8 fixed

const CAPTURE_WIDTH = isOculusBrowser ? 320 : 640; // NOTE: Oculus Browser can't record bigger videos atm
const CAPTURE_HEIGHT = isOculusBrowser ? 180 : 360;
const RENDER_WIDTH = 1280;
const RENDER_HEIGHT = 720;
const CAPTURE_DURATIONS = allowVideo ? [0, Infinity, 3, 7, 15, 30, 60] : [0];
const DEFAULT_CAPTURE_DURATION = allowVideo ? 3 : 0;
const COUNTDOWN_DURATION = 3;
const VIDEO_LOOPS = 3; // Number of times to loop the videos we spawn before stopping them (for perf)
const MAX_DURATION_TO_LIMIT_LOOPS = 31; // Max duration for which we limit loops (eg GIFs vs long form videos)

const snapCanvas = document.createElement("canvas");

async function pixelsToPNG(pixels, width, height) {
  snapCanvas.width = width;
  snapCanvas.height = height;
  const context = snapCanvas.getContext("2d");

  const imageData = context.createImageData(width, height);
  imageData.data.set(pixels);
  const bitmap = await createImageBitmap(imageData);
  context.scale(1, -1);
  context.drawImage(bitmap, 0, -height);
  const blob = await new Promise(resolve => snapCanvas.toBlob(resolve));
  return new File([blob], "snap.png", { type: "image/png" });
}

async function convertWebMChunksToSeekable(chunks) {
  const decoder = new ebml.Decoder();
  const reader = new ebml.Reader();
  reader.logging = false;
  reader.drop_default_duration = false;

  for (let i = 0; i < chunks.length; i++) {
    const buf = new Buffer(await new Response(chunks[i]).arrayBuffer());
    decoder.decode(buf).forEach(e => reader.read(e));
  }

  reader.stop();

  const seekableMeta = ebml.tools.makeMetadataSeekable(reader.metadatas, reader.duration, reader.cues);
  const body = new Buffer(await new Response(chunks[0]).arrayBuffer()).slice(reader.metadataSize);
  return new Buffer(ebml.tools.concat([new Buffer(seekableMeta), body]).buffer);
}

AFRAME.registerComponent("camera-tool", {
  schema: {
    captureDuration: { default: DEFAULT_CAPTURE_DURATION },
    captureAudio: { default: false },
    isSnapping: { default: false },
    isRecording: { default: false },
    label: { default: "" }
  },

  init() {
    this.lastUpdate = performance.now();
    this.localSnapCount = 0; // Counter that is used to arrange photos/videos

    this.showCameraViewport = !isMobileVR;

    this.renderTarget = new THREE.WebGLRenderTarget(RENDER_WIDTH, RENDER_HEIGHT, {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      encoding: THREE.sRGBEncoding,
      depth: false,
      stencil: false
    });

    this.camera = new THREE.PerspectiveCamera(50, RENDER_WIDTH / RENDER_HEIGHT, 0.1, 30000);
    this.camera.rotation.set(0, Math.PI, 0);
    this.camera.position.set(0, 0, 0.05);
    this.camera.matrixNeedsUpdate = true;
    this.el.setObject3D("camera", this.camera);

    const material = new THREE.MeshBasicMaterial({
      map: this.renderTarget.texture
    });

    // Bit of a hack here to only update the renderTarget when the screens are in view
    material.map.isVideoTexture = true;
    material.map.update = () => {
      if (this.showCameraViewport) {
        this.viewportInViewThisFrame = true;
      }
    };

    this.el.sceneEl.addEventListener("stateadded", () => this.updateUI());
    this.el.sceneEl.addEventListener("stateremoved", () => this.updateUI());

    cameraModelPromise.then(model => {
      const mesh = model.scene.clone();
      mesh.scale.set(2, 2, 2);
      mesh.matrixNeedsUpdate = true;
      this.el.setObject3D("mesh", mesh);

      const width = 0.28;
      const geometry = new THREE.PlaneBufferGeometry(width, width / this.camera.aspect);

      const environmentMapComponent = this.el.sceneEl.components["environment-map"];
      if (environmentMapComponent) {
        environmentMapComponent.applyEnvironmentMap(this.el.object3D);
      }

      this.screen = new THREE.Mesh(geometry, material);
      this.screen.rotation.set(0, Math.PI, 0);
      this.screen.position.set(0, 0, -0.042);
      this.screen.matrixNeedsUpdate = true;
      this.el.setObject3D("screen", this.screen);

      this.selfieScreen = new THREE.Mesh(geometry, material);
      this.selfieScreen.position.set(0, 0.4, 0);
      this.selfieScreen.scale.set(-2, 2, 2);
      this.selfieScreen.matrixNeedsUpdate = true;
      this.el.setObject3D("selfieScreen", this.selfieScreen);

      this.label = this.el.querySelector(".label");
      this.labelActionBackground = this.el.querySelector(".label-action-background");
      this.labelBackground = this.el.querySelector(".label-background");
      this.durationLabel = this.el.querySelector(".duration");

      this.snapIcon = this.el.querySelector(".snap-icon");
      this.recordIcon = this.el.querySelector(".record-icon");
      this.recordAlphaIcon = this.el.querySelector(".record-alpha-icon");

      this.label.object3D.visible = false;
      this.durationLabel.object3D.visible = false;

      this.snapButton = this.el.querySelector(".snap-button");
      this.cancelButton = this.el.querySelector(".cancel-button");
      this.nextDurationButton = this.el.querySelector(".next-duration");
      this.prevDurationButton = this.el.querySelector(".prev-duration");
      this.snapButton.object3D.addEventListener("interact", () => this.snapClicked());
      this.cancelButton.object3D.addEventListener("interact", () => this.cancelSnapping());
      this.nextDurationButton.object3D.addEventListener("interact", () => this.changeDuration(1));
      this.prevDurationButton.object3D.addEventListener("interact", () => this.changeDuration(-1));
      this.stopButton = this.el.querySelector(".stop-button");
      this.stopButton.object3D.addEventListener("interact", () => this.stopRecording());
      this.captureAudioButton = this.el.querySelector(".capture-audio");
      this.captureAudioIcon = this.el.querySelector(".capture-audio-icon");
      this.captureAudioButton.object3D.addEventListener("interact", () =>
        this.el.setAttribute("camera-tool", "captureAudio", !this.data.captureAudio)
      );

      this.updateUI();

      this.updateRenderTargetNextTick = true;

      this.cameraSystem = this.el.sceneEl.systems["camera-tools"];
      this.cameraSystem.register(this.el);
    });
  },

  remove() {
    this.cameraSystem.deregister(this.el);
    this.el.sceneEl.emit("camera_removed");
    this.stopRecording();
  },

  updateViewport() {
    this.updateRenderTargetNextTick = true;
  },

  changeDuration(delta) {
    const idx = CAPTURE_DURATIONS.findIndex(d => this.data.captureDuration == d);
    const newIdx = idx === 0 && delta === -1 ? CAPTURE_DURATIONS.length - 1 : (idx + delta) % CAPTURE_DURATIONS.length;
    this.el.setAttribute("camera-tool", "captureDuration", CAPTURE_DURATIONS[newIdx]);
  },

  focus(el, track) {
    if (track) {
      this.trackTarget = el;
    } else {
      this.trackTarget = null;
    }

    this.lookAt(el);
  },

  lookAt: (function() {
    const targetPos = new THREE.Vector3();
    return function(el) {
      targetPos.setFromMatrixPosition(el.object3D.matrixWorld);
      this.el.object3D.lookAt(targetPos);
      this.el.object3D.matrixNeedsUpdate = true;
    };
  })(),

  onAvatarUpdated() {
    delete this.playerHead;
  },

  snapClicked() {
    if (this.data.isSnapping) return;
    if (!NAF.utils.isMine(this.el) && !NAF.utils.takeOwnership(this.el)) return;

    this.el.setAttribute("camera-tool", "isSnapping", true);
    this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CAMERA_TOOL_COUNTDOWN);

    this.snapCountdown = COUNTDOWN_DURATION;
    this.el.setAttribute("camera-tool", "label", `${this.snapCountdown}`);

    this.countdownInterval = setInterval(async () => {
      if (!NAF.utils.isMine(this.el) && !NAF.utils.takeOwnership(this.el)) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        return;
      }

      this.snapCountdown--;

      if (this.snapCountdown === 0) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;

        if (this.data.captureDuration === 0) {
          this.el.setAttribute("camera-tool", { label: "", isSnapping: false });
          this.takeSnapshotNextTick = true;
        } else {
          this.beginRecording(this.data.captureDuration);
        }
      } else {
        this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CAMERA_TOOL_COUNTDOWN);
        this.el.setAttribute("camera-tool", "label", `${this.snapCountdown}`);
      }
    }, 1000);
  },

  cancelSnapping() {
    clearInterval(this.countdownInterval);
    this.stopRecording(true);
    this.updateUI();
  },

  update() {
    this.updateUI();
  },

  updateUI() {
    if (!this.label) return;

    const label = this.data.label;
    const isFrozen = this.el.sceneEl.is("frozen");
    const hasDuration = this.data.captureDuration !== 0 && this.data.captureDuration !== Infinity;
    const isPhoto = this.data.captureDuration === 0;

    const isRecordingUnbound = !hasDuration && this.data.isRecording && this.videoRecorder;
    this.label.object3D.visible = !!label && !isRecordingUnbound;
    const showActionLabelBackground = this.label.object3D.visible && this.data.isRecording && !isRecordingUnbound;

    if (label) {
      this.label.setAttribute("text", { value: label, color: showActionLabelBackground ? "#fafafa" : "#ff3464" });
    }

    this.labelActionBackground.object3D.visible = showActionLabelBackground;
    this.labelBackground.object3D.visible = this.label.object3D.visible && !showActionLabelBackground;

    this.stopButton.object3D.visible = isRecordingUnbound;

    if (hasDuration) {
      this.durationLabel.setAttribute("text", "value", `${this.data.captureDuration}`);
    }

    this.durationLabel.object3D.visible = hasDuration && !this.data.isSnapping && !isFrozen;
    this.recordIcon.object3D.visible = !hasDuration && !isPhoto && !isFrozen;
    this.recordAlphaIcon.object3D.visible = hasDuration && !isPhoto && !isFrozen;
    this.snapIcon.object3D.visible = isPhoto && !isFrozen;
    this.snapButton.object3D.visible = !this.data.isSnapping && !isFrozen;
    this.cancelButton.object3D.visible = this.data.isSnapping && !isFrozen;
    this.prevDurationButton.object3D.visible = this.nextDurationButton.object3D.visible =
      !this.data.isSnapping && allowVideo && !isFrozen;

    this.captureAudioIcon.setAttribute("icon-button", "active", this.data.captureAudio);
  },

  async beginRecording(duration) {
    if (!this.videoContext) {
      this.videoCanvas = document.createElement("canvas");
      this.videoCanvas.width = CAPTURE_WIDTH;
      this.videoCanvas.height = CAPTURE_HEIGHT;
      this.videoContext = this.videoCanvas.getContext("2d");
      this.videoImageData = this.videoContext.createImageData(CAPTURE_WIDTH, CAPTURE_HEIGHT);
      this.videoPixels = new Uint8Array(CAPTURE_WIDTH * CAPTURE_HEIGHT * 4);
      this.videoImageData.data.set(this.videoPixels);
    }

    // Begin sampling local audio so we can perform head scaling
    this.el.sceneEl.setAttribute("local-audio-analyser", { analyze: true });

    const stream = new MediaStream();
    const track = this.videoCanvas.captureStream(VIDEO_FPS).getVideoTracks()[0];

    if (this.data.captureAudio) {
      const context = THREE.AudioContext.getContext();
      const destination = context.createMediaStreamDestination();

      const listener = this.el.sceneEl.audioListener;
      if (listener) {
        // NOTE audio is not captured from camera vantage point for now.
        listener.getInput().connect(destination);
      }

      const selfAudio = await NAF.connection.adapter.getMediaStream(NAF.clientId, "audio");
      if (selfAudio) {
        context.createMediaStreamSource(selfAudio).connect(destination);
      }

      const audio = destination.stream.getAudioTracks()[0];
      stream.addTrack(audio);
    }

    stream.addTrack(track);
    this.videoRecorder = new MediaRecorder(stream, { mimeType: videoMimeType });
    const chunks = [];
    const recordingStartTime = performance.now();

    this.videoRecorder.ondataavailable = e => chunks.push(e.data);
    this.videoRecorder._free = () => (chunks.length = 0); // Used for cancelling
    this.videoRecorder.onstop = async () => {
      if (chunks.length === 0) return;
      const mimeType = chunks[0].type;
      let blob;

      const recordingDuration = performance.now() - recordingStartTime;

      if (browser.name === "chrome") {
        // HACK, on chrome, webms are unseekable
        const seekable = await convertWebMChunksToSeekable(chunks);
        blob = new Blob([seekable], { type: mimeType });
      } else {
        blob = new Blob(chunks, { type: mimeType });
      }

      chunks.length = 0;

      const { entity, orientation } = spawnMediaAround(
        this.el,
        new File([blob], "capture", { type: mimeType }),
        this.localSnapCount,
        "video",
        true
      );

      // To limit the # of concurrent videos playing, if it was a short clip, let it loop
      // a few times and then pause it.
      if (recordingDuration <= MAX_DURATION_TO_LIMIT_LOOPS * 1000) {
        setTimeout(
          () => entity.components["media-video"] && entity.components["media-video"].tryUpdateVideoPlaybackState(true),
          recordingDuration * VIDEO_LOOPS + 100
        );
      }

      this.localSnapCount++;

      orientation.then(() => this.el.sceneEl.emit("object_spawned", { objectType: ObjectTypes.CAMERA }));
    };

    this.updateRenderTargetNextTick = true;

    this.videoRecorder.start();
    this.el.setAttribute("camera-tool", { isRecording: true, label: " " });

    if (duration !== Infinity) {
      this.videoCountdown = this.data.captureDuration;
      this.el.setAttribute("camera-tool", "label", `${this.videoCountdown}`);

      this.videoCountdownInterval = setInterval(() => {
        this.videoCountdown--;

        if (this.videoCountdown === 0) {
          this.stopRecording();
          this.videoCountdownInterval = null;
        } else {
          this.el.setAttribute("camera-tool", "label", `${this.videoCountdown}`);
        }
      }, 1000);
    }
  },

  stopRecording(cancel) {
    if (this.videoRecorder) {
      if (cancel) {
        this.videoRecorder.onstop = () => {};
        this.videoRecorder._free();
      }

      this.videoRecorder.stop();
      this.videoRecorder = null;

      if (!cancel) {
        this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CAMERA_TOOL_TOOK_SNAPSHOT);
      }
    }
    clearInterval(this.videoCountdownInterval);

    this.videoCountdownInterval = null;
    this.el.setAttribute("camera-tool", "label", "");
    this.el.setAttribute("camera-tool", { isRecording: false, isSnapping: false });
    this.el.sceneEl.setAttribute("local-audio-analyser", { analyze: false });
  },

  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const userinput = AFRAME.scenes[0].systems.userinput;
    const heldLeftHand = interaction.state.leftHand.held === this.el;
    const heldRightHand = interaction.state.rightHand.held === this.el;
    const heldRightRemote = interaction.state.rightRemote.held === this.el;

    const heldThisFrame =
      (heldLeftHand && userinput.get(interaction.options.leftHand.grabPath)) ||
      (heldRightHand && userinput.get(interaction.options.rightHand.grabPath)) ||
      (heldRightRemote && userinput.get(interaction.options.rightRemote.grabPath));

    const isHolding = heldLeftHand || heldRightHand || heldRightRemote;

    if (heldThisFrame) {
      this.localSnapCount = 0;
    }

    this.showCameraViewport = isHolding || !isMobileVR || this.data.isSnapping || this.videoRecorder;

    if (this.screen && this.selfieScreen) {
      this.screen.visible = this.selfieScreen.visible = !!this.showCameraViewport;
    }

    // Always draw held, snapping, or recording camera viewports with a decent framerate
    if (
      (isHolding || this.data.isSnapping || this.videoRecorder) &&
      performance.now() - this.lastUpdate >= 1000 / (this.videoRecorder ? VIDEO_FPS : VIEWPORT_FPS)
    ) {
      this.updateRenderTargetNextTick = true;
    }

    const isHoldingTrigger = this.isHoldingSnapshotTrigger();

    // If the user lets go of the trigger before 500ms, take a picture, otherwise record until they let go.
    if (isHoldingTrigger && !this.data.isSnapping && !this.snapTriggerTimeout) {
      this.snapTriggerTimeout = setTimeout(() => {
        if (this.isHoldingSnapshotTrigger()) {
          this.el.setAttribute("camera-tool", "isSnapping", true);
          this.beginRecording(Infinity);

          const releaseInterval = setInterval(() => {
            if (this.isHoldingSnapshotTrigger()) return;
            this.stopRecording();
            clearInterval(releaseInterval);
          }, 500);
        }

        this.snapTriggerTimeout = null;
      }, 500);
    } else if (!isHoldingTrigger && !this.data.isSnapping && this.snapTriggerTimeout) {
      clearTimeout(this.snapTriggerTimeout);
      this.snapTriggerTimeout = null;
      this.takeSnapshotNextTick = true;
    }
  },

  tock: (function() {
    const tempHeadScale = new THREE.Vector3();

    return function tock() {
      const sceneEl = this.el.sceneEl;
      const renderer = this.renderer || sceneEl.renderer;
      const now = performance.now();

      // Perform lookAt in tock so it will re-orient after grabs, etc.
      if (this.trackTarget) {
        if (this.trackTarget.parentNode) {
          this.lookAt(this.trackTarget);
        } else {
          this.trackTarget = null; // Target removed
        }
      }

      if (!this.playerHead) {
        const headEl = document.getElementById("player-head");
        this.playerHead = headEl && headEl.object3D;
      }

      if (!this.playerHud) {
        const hudEl = document.getElementById("player-hud");
        this.playerHud = hudEl && hudEl.object3D;
      }

      if (
        this.takeSnapshotNextTick ||
        (this.updateRenderTargetNextTick && (this.viewportInViewThisFrame || this.videoRecorder))
      ) {
        if (this.playerHead) {
          tempHeadScale.copy(this.playerHead.scale);

          // We want to scale our own head in between frames now that we're taking a video/photo.
          let scale = 1;
          const analyser = this.el.sceneEl.systems["local-audio-analyser"];

          if (analyser && analyser.data.analyze && this.playerHead.el.components["scale-audio-feedback"]) {
            scale = getAudioFeedbackScale(this.el.object3D, this.playerHead, 1, 2, analyser.volume);
          }

          this.playerHead.scale.set(scale, scale, scale);
          this.playerHead.updateMatrices(true, true);
          this.playerHead.updateMatrixWorld(true, true);
        }

        let playerHudWasVisible = false;

        if (this.playerHud) {
          playerHudWasVisible = this.playerHud.visible;
          this.playerHud.visible = false;
          if (this.el.sceneEl.systems["post-physics"]) {
            this.el.sceneEl.systems["post-physics"].spriteSystem.mesh.visible = false;
          }
        }

        const tmpVRFlag = renderer.vr.enabled;
        const tmpOnAfterRender = sceneEl.object3D.onAfterRender;
        delete sceneEl.object3D.onAfterRender;
        renderer.vr.enabled = false;

        if (allowVideo && this.videoRecorder && !this.videoRenderTarget) {
          // Create a separate render target for video becuase we need to flip and (sometimes) downscale it before
          // encoding it to video.
          this.videoRenderTarget = new THREE.WebGLRenderTarget(CAPTURE_WIDTH, CAPTURE_HEIGHT, {
            format: THREE.RGBAFormat,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            encoding: THREE.sRGBEncoding,
            depth: false,
            stencil: false
          });

          // Used to set up framebuffer in three.js as a side effect
          renderer.setRenderTarget(this.videoRenderTarget);
        }

        renderer.setRenderTarget(this.renderTarget);
        renderer.render(sceneEl.object3D, this.camera);
        renderer.setRenderTarget(null);

        renderer.vr.enabled = tmpVRFlag;
        sceneEl.object3D.onAfterRender = tmpOnAfterRender;
        if (this.playerHead) {
          this.playerHead.scale.copy(tempHeadScale);
          this.playerHead.updateMatrices(true, true);
          this.playerHead.updateMatrixWorld(true, true);
        }
        if (this.playerHud) {
          this.playerHud.visible = playerHudWasVisible;
          if (this.el.sceneEl.systems["post-physics"]) {
            this.el.sceneEl.systems["post-physics"].spriteSystem.mesh.visible = true;
          }
        }
        this.lastUpdate = now;

        if (this.videoRecorder) {
          // This blit operation will (if necessary) scale/resample the view finder render target and, importantly,
          // flip the texture on Y
          renderer.blitFramebuffer(
            this.renderTarget,
            0,
            0,
            RENDER_WIDTH,
            RENDER_HEIGHT,
            this.videoRenderTarget,
            0,
            CAPTURE_HEIGHT,
            CAPTURE_WIDTH,
            0
          );
          renderer.readRenderTargetPixels(
            this.videoRenderTarget,
            0,
            0,
            CAPTURE_WIDTH,
            CAPTURE_HEIGHT,
            this.videoPixels
          );
          this.videoImageData.data.set(this.videoPixels);
          this.videoContext.putImageData(this.videoImageData, 0, 0);
        }

        this.updateRenderTargetNextTick = false;
        this.viewportInViewThisFrame = false;
      }

      if (this.takeSnapshotNextTick) {
        if (!this.snapPixels) {
          this.snapPixels = new Uint8Array(RENDER_WIDTH * RENDER_HEIGHT * 4);
        }
        renderer.readRenderTargetPixels(this.renderTarget, 0, 0, RENDER_WIDTH, RENDER_HEIGHT, this.snapPixels);

        pixelsToPNG(this.snapPixels, RENDER_WIDTH, RENDER_HEIGHT).then(file => {
          const { orientation } = spawnMediaAround(this.el, file, this.localSnapCount, "photo", true);

          orientation.then(() => {
            this.el.sceneEl.emit("object_spawned", { objectType: ObjectTypes.CAMERA });
          });
        });
        sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CAMERA_TOOL_TOOK_SNAPSHOT);
        this.takeSnapshotNextTick = false;
        this.localSnapCount++;
      }
    };
  })(),

  isHoldingSnapshotTrigger: function() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const userinput = AFRAME.scenes[0].systems.userinput;
    const heldLeftHand = interaction.state.leftHand.held === this.el;
    const heldRightHand = interaction.state.rightHand.held === this.el;
    const heldRightRemote = interaction.state.rightRemote.held === this.el;

    let grabberId;
    if (heldRightHand) {
      grabberId = "player-right-controller";
    } else if (heldLeftHand) {
      grabberId = "player-left-controller";
    } else if (heldRightRemote) {
      grabberId = "cursor";
    }

    if (grabberId) {
      const grabberPaths = pathsMap[grabberId];
      if (userinput.get(grabberPaths.takeSnapshot)) {
        return true;
      }
    }

    return !!userinput.get(paths.actions.takeSnapshot);
  }
});
