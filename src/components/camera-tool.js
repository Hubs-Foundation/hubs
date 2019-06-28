import { spawnMediaAround } from "../utils/media-utils";
import { createImageBitmap } from "../utils/image-bitmap-utils";
import { ObjectTypes } from "../object-types";
import { paths } from "../systems/userinput/paths";
import { SOUND_CAMERA_TOOL_TOOK_SNAPSHOT, SOUND_CAMERA_TOOL_COUNTDOWN } from "../systems/sound-effects-system";
import * as ebml from "ts-ebml";
import { Buffer } from "buffer";

window.Buffer = Buffer;

import cameraModelSrc from "../assets/camera_tool.glb";

const cameraModelPromise = new Promise(resolve => new THREE.GLTFLoader().load(cameraModelSrc, resolve));

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

const heldOrSnappingViewportFPS = 6;
const videoRecordingFPS = 25;
const captureWidth = isMobileVR ? 320 : 1280; // NOTE: Oculus Quest can't record bigger videos atm
const captureHeight = isMobileVR ? 180 : 720;
const renderWidth = 1280;
const renderHeight = 720;

const snapCanvas = document.createElement("canvas");

const videoCanvas = document.createElement("canvas");
videoCanvas.width = captureWidth;
videoCanvas.height = captureHeight;

const videoContext = videoCanvas.getContext("2d");
const videoImageData = videoContext.createImageData(captureWidth, captureHeight);
const videoPixels = new Uint8Array(captureWidth * captureHeight * 4);
videoImageData.data.set(videoPixels);

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

AFRAME.registerComponent("camera-tool", {
  schema: {
    isSnapping: { default: false },
    label: { default: "" }
  },

  init() {
    this.lastUpdate = performance.now();
    this.localSnapCount = 0; // Counter that is used to arrange photos

    // On mobile, we show the camera viewport when holding the camera or during a snapshot.
    this.showCameraViewport = !isMobileVR;

    this.renderTarget = new THREE.WebGLRenderTarget(renderWidth, renderHeight, {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      encoding: THREE.sRGBEncoding,
      depth: false,
      stencil: false
    });

    // Create a separate render target for video becuase we need to flip and (sometimes) downscale it before
    // encoding it to video.
    this.videoRenderTarget = new THREE.WebGLRenderTarget(captureWidth, captureHeight, {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      encoding: THREE.sRGBEncoding,
      depth: false,
      stencil: false
    });

    this.camera = new THREE.PerspectiveCamera(50, renderWidth / renderHeight, 0.1, 30000);
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
      this.label.object3D.visible = false;

      this.snapButton = this.el.querySelector(".snap-button");
      this.snapButton.object3D.addEventListener("interact", () => {
        this.beginSnapping();
      });

      this.updateRenderTargetNextTick = true;

      this.cameraSystem = this.el.sceneEl.systems["camera-tools"];
      this.cameraSystem.register(this.el);
    });
  },

  remove() {
    this.cameraSystem.deregister(this.el);
    this.el.sceneEl.systems["camera-mirror"].unmirrorCameraAtEl(this.el);
    this.el.sceneEl.emit("camera_removed");
  },

  updateViewport() {
    this.updateRenderTargetNextTick = true;
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

  mirror() {
    this.el.sceneEl.systems["camera-mirror"].mirrorCameraAtEl(this.el);
  },

  unmirror() {
    this.el.sceneEl.systems["camera-mirror"].unmirrorCameraAtEl(this.el);
  },

  onAvatarUpdated() {
    delete this.playerHead;
  },

  beginSnapping() {
    if (this.data.isSnapping) return;

    const interaction = AFRAME.scenes[0].systems.interaction;
    const heldLeftHand = interaction.state.leftHand.held === this.el;
    const heldRightHand = interaction.state.rightHand.held === this.el;
    const isHandHeld = heldLeftHand || heldRightHand;

    if (isHandHeld) {
      // Don't do a photo timer if it's being used while holding the camera, for instant snapping.
      this.takeSnapshotNextTick = true;
      return;
    }

    if (!NAF.utils.isMine(this.el) && !NAF.utils.takeOwnership(this.el)) return;
    this.el.setAttribute("camera-tool", "isSnapping", true);
    this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CAMERA_TOOL_COUNTDOWN);

    this.snapCountdown = 3;
    this.el.setAttribute("camera-tool", "label", `${this.snapCountdown}`);

    const interval = setInterval(() => {
      if (!NAF.utils.isMine(this.el) && !NAF.utils.takeOwnership(this.el)) {
        clearInterval(interval);
        return;
      }

      this.snapCountdown--;

      if (this.snapCountdown === 0) {
        this.el.setAttribute("camera-tool", { label: "", isSnapping: false });

        if (/* use still camera */ false) {
          this.takeSnapshotNextTick = true;
        } else {
          const stream = new MediaStream();
          const track = videoCanvas.captureStream(videoRecordingFPS).getVideoTracks()[0];
          /*const listener = this.el.sceneEl.audioListener;
          const destination = listener.context.createMediaStreamDestination();
          listener.getInput().connect(destination);
          const audio = destination.stream.getAudioTracks()[0];
          stream.addTrack(audio);*/

          stream.addTrack(track);
          this.videoRecorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp8" });
          const chunks = [];

          this.videoRecorder.ondataavailable = e => chunks.push(e.data);
          this.videoRecorder.onstop = async () => {
            console.log(chunks.length);
            if (chunks.length === 0) return;
            const mimeType = chunks[0].type;
            let blob;

            if (true) {
              // HACK, on chrome, webms are unseekable and so can't be played by some browsers like
              // Oculus Browser so use https://github.com/legokichi/ts-ebml
              const decoder = new ebml.Decoder();
              const reader = new ebml.Reader();
              reader.logging = false;
              reader.drop_default_duration = false;
              const buf = new Buffer(await new Response(chunks[0]).arrayBuffer());
              const elms = decoder.decode(buf);
              elms.forEach(elm => {
                reader.read(elm);
              });
              reader.stop();
              const refinedMetadataBuf = ebml.tools.makeMetadataSeekable(
                reader.metadatas,
                reader.duration,
                reader.cues
              );
              const body = buf.slice(reader.metadataSize);
              const refined = new Buffer(ebml.tools.concat([new Buffer(refinedMetadataBuf), body]).buffer);
              blob = new Blob([refined], { type: mimeType });
            } else {
              blob = new Blob(chunks, { type: mimeType });
            }

            chunks.length = 0;
            this.el.sceneEl.emit("add_media", new File([blob], "capture", { type: mimeType }));
            /*const { orientation } = spawnMediaAround(
              this.el,
              new File([blob], "capture", { type: mimeType }),
              this.localSnapCount,
              true
            );

            orientation.then(() => {
              this.el.sceneEl.emit("object_spawned", { objectType: ObjectTypes.CAMERA });
            });*/
          };

          this.updateRenderTargetNextTick = true;

          this.el.setAttribute("camera-tool", "label", "r");

          this.videoRecorder.start();

          setTimeout(() => {
            this.videoRecorder.stop();
            this.videoRecorder = null;
            this.el.setAttribute("camera-tool", "label", "");
          }, 5000);
        }

        clearInterval(interval);
      } else {
        this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CAMERA_TOOL_COUNTDOWN);
        this.el.setAttribute("camera-tool", "label", `${this.snapCountdown}`);
      }
    }, 1000);
  },

  async update() {
    const label = this.data.label;

    if (this.label) {
      if (label) {
        this.label.setAttribute("text", "value", label);
      }

      this.label.object3D.visible = !!label;
    }
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
      this.screen.visible = this.selfieScreen.visible = this.showCameraViewport;
    }

    // Always draw held, snapping, or recording camera viewports with a decent framerate
    if (
      (isHolding || this.data.isSnapping || this.videoRecorder) &&
      performance.now() - this.lastUpdate >= 1000 / (this.videoRecorder ? videoRecordingFPS : heldOrSnappingViewportFPS)
    ) {
      this.updateRenderTargetNextTick = true;
    }

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
        this.beginSnapping();
      }
    }

    if (userinput.get(paths.actions.takeSnapshot)) {
      this.beginSnapping();
    }
  },

  tock: (function() {
    const tempHeadScale = new THREE.Vector3();
    let hasSetupVideoRenderTarget = false;

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
          this.playerHead.scale.set(1, 1, 1);
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

        // HACK this sets up the framebuffer for the video render target
        if (!hasSetupVideoRenderTarget) {
          renderer.setRenderTarget(this.videoRenderTarget);
          hasSetupVideoRenderTarget = true;
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
            renderWidth,
            renderHeight,
            this.videoRenderTarget,
            0,
            captureHeight,
            captureWidth,
            0
          );
          renderer.readRenderTargetPixels(this.videoRenderTarget, 0, 0, captureWidth, captureHeight, videoPixels);
          videoImageData.data.set(videoPixels);
          videoContext.putImageData(videoImageData, 0, 0);
        }

        this.updateRenderTargetNextTick = false;
        this.viewportInViewThisFrame = false;
      }

      if (this.takeSnapshotNextTick) {
        if (!this.snapPixels) {
          this.snapPixels = new Uint8Array(renderWidth * renderHeight * 4);
        }
        renderer.readRenderTargetPixels(this.renderTarget, 0, 0, renderWidth, renderHeight, this.snapPixels);

        pixelsToPNG(this.snapPixels, renderWidth, renderHeight).then(file => {
          const { orientation } = spawnMediaAround(this.el, file, this.localSnapCount, true);

          orientation.then(() => {
            this.el.sceneEl.emit("object_spawned", { objectType: ObjectTypes.CAMERA });
          });
        });
        sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CAMERA_TOOL_TOOK_SNAPSHOT);
        this.takeSnapshotNextTick = false;
        this.localSnapCount++;
      }
    };
  })()
});
