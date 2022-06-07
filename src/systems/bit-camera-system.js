import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { CameraTool, Interacted, TextButton } from "../bit-components";
import { addAndArrangeMedia, addMedia, pixelsToPNG } from "../utils/media-utils";
import { SOUND_CAMERA_TOOL_COUNTDOWN, SOUND_CAMERA_TOOL_TOOK_SNAPSHOT } from "./sound-effects-system";

const { detect } = require("detect-browser");
const browser = detect();

const isFirefox = browser.name === "firefox";

// Prefer h264 if available due to faster decoding speec on most platforms
const videoCodec = ["h264", "vp9,opus", "vp8,opus", "vp9", "vp8"].find(
  codec => window.MediaRecorder && MediaRecorder.isTypeSupported(`video/webm; codecs=${codec}`)
);
const videoMimeType = videoCodec ? `video/webm; codecs=${videoCodec}` : null;
const hasWebGL2 = !!document.createElement("canvas").getContext("webgl2");
const allowVideo = !!videoMimeType && hasWebGL2;

const RENDER_WIDTH = 1280;
const RENDER_HEIGHT = 720;

const isMobileVR = AFRAME.utils.device.isMobileVR();
const isOculusBrowser = navigator.userAgent.match(/Oculus/);
// TODO ported from old camera system. Do we still want these restrictions?
const CAPTURE_WIDTH = isMobileVR && !isOculusBrowser ? 640 : 1280;
const CAPTURE_HEIGHT = isMobileVR && !isOculusBrowser ? 360 : 720;
const VIDEO_FPS = 25;

const CAMERA_STATE = {
  IDLE: 0,
  COUNTDOWN_PHOTO: 1,
  COUNTDOWN_VIDEO: 2,
  SNAP_PHOTO: 3,
  RECORDING_VIDEO: 4
};

const CAPTURE_DURATIONS = [3, 7, 15, 30, 60];

const renderTargets = new Map();
const videoStates = new Map();

function blitFramebuffer(renderer, src, srcX0, srcY0, srcX1, srcY1, dest, dstX0, dstY0, dstX1, dstY1) {
  const gl = renderer.getContext();

  // Copies from one framebuffer to another. Note that at the end of this function, you need to restore
  // the original framebuffer via setRenderTarget
  const srcFramebuffer = renderer.properties.get(src).__webglFramebuffer;
  const destFramebuffer = renderer.properties.get(dest).__webglFramebuffer;

  if (srcFramebuffer && destFramebuffer) {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, srcFramebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, destFramebuffer);

    if (gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      gl.blitFramebuffer(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, gl.COLOR_BUFFER_BIT, gl.LINEAR);
    }
  }
}

function createVideoState() {
  const videoCanvas = document.createElement("canvas");
  videoCanvas.width = CAPTURE_WIDTH;
  videoCanvas.height = CAPTURE_HEIGHT;
  const videoContext = videoCanvas.getContext("2d");
  const videoImageData = videoContext.createImageData(CAPTURE_WIDTH, CAPTURE_HEIGHT);
  const videoPixels = new Uint8Array(CAPTURE_WIDTH * CAPTURE_HEIGHT * 4);
  videoImageData.data.set(videoPixels);

  // Create a separate render target for video because we need to flip (and sometimes downscale) it before
  // encoding it to video.
  const videoRenderTarget = new THREE.WebGLRenderTarget(CAPTURE_WIDTH, CAPTURE_HEIGHT, {
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    encoding: THREE.sRGBEncoding,
    depth: false,
    stencil: false
  });

  const renderer = AFRAME.scenes[0].renderer;
  const tmpRenderTarget = renderer.getCurrentRenderTarget();
  // Used to set up framebuffer in three.js as a side effect
  renderer.setRenderTarget(videoRenderTarget);
  renderer.setRenderTarget(tmpRenderTarget);

  return { videoCanvas, videoContext, videoImageData, videoPixels, videoRenderTarget };
}

function clicked(eid) {
  return hasComponent(APP.world, Interacted, eid);
}

function createStream(videoCanvas) {
  const stream = videoCanvas.captureStream(VIDEO_FPS);
  console.log("stream", stream);

  // This adds hacks for current browser issues with media recordings when audio tracks are muted or missing.
  const attachBlankAudioIfNeeded = () => {
    // Chrome has issues when the audio tracks are silent so we only do this for FF.
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1223382
    if (isFirefox) {
      // FF 73+ seems to fail to decode videos with no audio track, so we always include a silent track.
      const context = THREE.AudioContext.getContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const destination = context.createMediaStreamDestination();
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      oscillator.connect(destination);
      gain.connect(destination);
      stream.addTrack(destination.stream.getAudioTracks()[0]);
    }
  };

  const captureAudio = false;

  // NOTE: if we don't have a self audio track, we can end up generating an empty video (browser bug?)
  // if no audio comes through on the listener source. (Eg the room is otherwise silent.)
  // So for now, if we don't have a track, just disable audio capture.
  if (captureAudio && APP.dialog._micProducer?.track) {
    const context = THREE.AudioContext.getContext();
    const destination = context.createMediaStreamDestination();
    if (APP.audioListener) {
      // NOTE audio is not captured from camera vantage point for now.
      APP.audioListener.getInput().connect(destination);
    }
    context.createMediaStreamSource(APP.dialog._micProducer?.track).connect(destination);
    const audio = destination.stream.getAudioTracks()[0];
    stream.addTrack(audio);
  } else {
    attachBlankAudioIfNeeded();
  }
  return stream;
}

function beginRecording(world, eid) {
  const videoState = createVideoState();
  videoStates.set(eid, videoState);

  // const recorder = new RenderTargetRecorder(renderer, srcRenderTarget, srcAudioTrack)
  // recorder.start()
  // recorder.captureFrame()
  // recorder.stop()

  videoState.videoRecorder = new MediaRecorder(createStream(videoState.videoCanvas), { mimeType: videoMimeType });

  const chunks = [];
  const recordingStartTime = performance.now();

  videoState.videoRecorder.ondataavailable = e => chunks.push(e.data);

  videoState.videoRecorder.onstop = async () => {
    console.log("onstop");

    if (chunks.length === 0) return;
    const mimeType = chunks[0].type;
    const recordingDuration = performance.now() - recordingStartTime;
    const blob = new Blob(chunks, { type: mimeType });
    const file = new File([blob], "capture", { type: mimeType.split(";")[0] }); // Drop codec
    console.log(chunks, blob, file);
    chunks.length = 0;

    const { entity, orientation } = addMedia(file, "#interactable-media", undefined, "video-camera", false);

    const cameraObj = world.eid2obj.get(eid);
    entity.object3D.position.copy(cameraObj.localToWorld(new THREE.Vector3(0, -0.5, 0)));

    AFRAME.scenes[0].systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CAMERA_TOOL_TOOK_SNAPSHOT);

    // const { entity, orientation } = addAndArrangeMedia(
    //   this.el,
    //   new File([blob], "capture", { type: mimeType.split(";")[0] }), // Drop codec
    //   "video-camera",
    //   this.localSnapCount,
    //   !!this.playerIsBehindCamera
    // );

    entity.addEventListener(
      "video-loaded",
      () => {
        // If we were recording audio, then pause the video immediately after starting.

        // Or, to limit the # of concurrent videos playing, if it was a short clip, let it loop
        // a few times and then pause it.
        if (captureAudio || recordingDuration <= MAX_DURATION_TO_LIMIT_LOOPS * 1000) {
          setTimeout(() => {
            if (!NAF.utils.isMine(entity) && !NAF.utils.takeOwnership(entity)) return;
            entity.components["media-video"].tryUpdateVideoPlaybackState(true);
          }, captureAudio ? 0 : recordingDuration * VIDEO_LOOPS + 100);
        }
      },
      { once: true }
    );

    // this.localSnapCount++;

    // orientation.then(() => this.el.sceneEl.emit("object_spawned", { objectType: ObjectTypes.CAMERA }));
  };

  videoState.videoRecorder.start();
  APP.hubChannel.beginRecording();
}

function copyVideoFrame(_world, eid) {
  const renderer = AFRAME.scenes[0].renderer;
  const srcRenterTarget = renderTargets.get(eid);
  const videoState = videoStates.get(eid);

  blitFramebuffer(
    renderer,
    srcRenterTarget,
    0,
    0,
    RENDER_WIDTH,
    RENDER_HEIGHT,
    videoState.videoRenderTarget,
    0,
    CAPTURE_HEIGHT,
    CAPTURE_WIDTH,
    0
  );
  renderer.readRenderTargetPixels(
    videoState.videoRenderTarget,
    0,
    0,
    CAPTURE_WIDTH,
    CAPTURE_HEIGHT,
    videoState.videoPixels
  );
  videoState.videoImageData.data.set(videoState.videoPixels);
  videoState.videoContext.putImageData(videoState.videoImageData, 0, 0);
}

function endRecording(_world, eid, cancel) {
  const videoState = videoStates.get(eid);
  if (videoState.videoRecorder) {
    if (cancel) {
      videoState.videoRecorder.onstop = () => {};
    }
    console.log("calling stop");
    videoState.videoRecorder.stop();
    console.log("called stop");
  }
  videoStates.delete(eid);
  APP.hubChannel.endRecording();
}

function updateRenderTarget(world, camera) {
  const sceneEl = AFRAME.scenes[0];
  const renderer = AFRAME.scenes[0].renderer;

  const tmpVRFlag = renderer.xr.enabled;
  renderer.xr.enabled = false;

  // TODO we are doing this because aframe usees this hook for tock.
  // Namely to capture what camera was rendering. We don't actually use that in any of our tocks.
  // Also tock can likely go away as a concept since we can just direclty order things after render in raf if we want to.
  const tmpOnAfterRender = sceneEl.object3D.onAfterRender;
  delete sceneEl.object3D.onAfterRender;

  // TODO this assumption is now not true since we are not running after render. We should probably just permentently turn of autoUpdate and run matrix updates at a point we wnat to.
  // The entire scene graph matrices should already be updated
  // in tick(). They don't need to be recomputed again in tock().
  const tmpAutoUpdate = sceneEl.object3D.autoUpdate;
  sceneEl.object3D.autoUpdate = false;

  renderer.setRenderTarget(renderTargets.get(camera));
  renderer.render(sceneEl.object3D, world.eid2obj.get(CameraTool.cameraRef[camera]));
  renderer.setRenderTarget(null);

  renderer.xr.enabled = tmpVRFlag;
  sceneEl.object3D.onAfterRender = tmpOnAfterRender;
  sceneEl.object3D.autoUpdate = tmpAutoUpdate;
}

function updateUI(world, camera) {
  const snapBtnObj = world.eid2obj.get(CameraTool.snapRef[camera]);
  const cancelBtnObj = world.eid2obj.get(CameraTool.cancelRef[camera]);
  const nextBtnObj = world.eid2obj.get(CameraTool.button_next[camera]);
  const prevBtnObj = world.eid2obj.get(CameraTool.button_prev[camera]);
  snapBtnObj.visible = CameraTool.state[camera] === CAMERA_STATE.IDLE;
  cancelBtnObj.visible =
    CameraTool.state[camera] === CAMERA_STATE.COUNTDOWN_PHOTO ||
    CameraTool.state[camera] === CAMERA_STATE.COUNTDOWN_VIDEO ||
    CameraTool.state[camera] === CAMERA_STATE.RECORDING_VIDEO;
  nextBtnObj.visible = CameraTool.state[camera] === CAMERA_STATE.IDLE;
  prevBtnObj.visible = CameraTool.state[camera] === CAMERA_STATE.IDLE;

  const countdownLblObj = world.eid2obj.get(CameraTool.countdownLblRef[camera]);
  countdownLblObj.visible =
    CameraTool.state[camera] === CAMERA_STATE.COUNTDOWN_PHOTO ||
    CameraTool.state[camera] === CAMERA_STATE.COUNTDOWN_VIDEO ||
    CameraTool.state[camera] === CAMERA_STATE.RECORDING_VIDEO;
  if (countdownLblObj.visible) {
    const timeLeftSec = Math.ceil((CameraTool.snapTime[camera] - world.time.elapsed) / 1000);
    countdownLblObj.text = timeLeftSec;
    countdownLblObj.sync(); // TODO this should probably happen in 1 spot per frame for all Texts
  }

  const captureDurLblObj = world.eid2obj.get(CameraTool.captureDurLblRef[camera]);
  captureDurLblObj.visible = CameraTool.state[camera] === CAMERA_STATE.IDLE;
  if (captureDurLblObj.visible) {
    captureDurLblObj.text = CAPTURE_DURATIONS[CameraTool.captureDurIdx[camera]];
    captureDurLblObj.sync(); // TODO this should probably happen in 1 spot per frame for all Texts
  }
}

let snapPixels;
function captureSnapshot(world, camera) {
  const sceneEl = AFRAME.scenes[0];
  const renderer = AFRAME.scenes[0].renderer;

  const cameraObj = world.eid2obj.get(camera);

  if (!snapPixels) {
    snapPixels = new Uint8Array(RENDER_WIDTH * RENDER_HEIGHT * 4);
  }

  renderer.readRenderTargetPixels(renderTargets.get(camera), 0, 0, RENDER_WIDTH, RENDER_HEIGHT, snapPixels);

  pixelsToPNG(snapPixels, RENDER_WIDTH, RENDER_HEIGHT).then(file => {
    const { entity, orientation } = addMedia(file, "#interactable-media", undefined, "photo-camera", false);

    entity.object3D.position.copy(cameraObj.localToWorld(new THREE.Vector3(0, -0.5, 0)));

    // const { orientation } = addAndArrangeMedia(
    //   this.el,
    //   file,
    //   "photo-camera",
    //   this.localSnapCount,
    //   !!this.playerIsBehindCamera
    // );

    // orientation.then(() => {
    //   this.el.sceneEl.emit("object_spawned", { objectType: ObjectTypes.CAMERA });
    // });
  });
  sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CAMERA_TOOL_TOOK_SNAPSHOT);
  // this.localSnapCount++;
}

const cameraToolQuery = defineQuery([CameraTool]);
const cameraToolEnterQuery = enterQuery(cameraToolQuery);
const cameraToolExitQuery = exitQuery(cameraToolQuery);

export function cameraSystem(world) {
  cameraToolEnterQuery(world).forEach(function(eid) {
    const renderTarget = new THREE.WebGLRenderTarget(RENDER_WIDTH, RENDER_HEIGHT, {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      encoding: THREE.GammaEncoding,
      depth: false,
      stencil: false
    });

    // Bit of a hack here to only update the renderTarget when the screens are in view
    // renderTarget.texture.isVideoTexture = true;
    // renderTarget.texture.update = () => {
    // if (this.showCameraViewfinder) {
    //   this.viewfinderInViewThisFrame = true;
    // }
    // };

    const screenObj = world.eid2obj.get(CameraTool.screenRef[eid]);
    const selfieScreenObj = world.eid2obj.get(CameraTool.selfieScreenRef[eid]);
    screenObj.material.map = renderTarget.texture;
    selfieScreenObj.material.map = renderTarget.texture;

    renderTargets.set(eid, renderTarget);
  });

  cameraToolExitQuery(world).forEach(function(eid) {
    const renderTarget = renderTargets.get(eid);
    renderTarget.dispose();
    renderTargets.delete(eid);
  });

  cameraToolQuery(world).forEach(camera => {
    if (CameraTool.state[camera] === CAMERA_STATE.IDLE) {
      if (clicked(CameraTool.snapRef[camera])) {
        CameraTool.state[camera] = CAMERA_STATE.COUNTDOWN_PHOTO;
        CameraTool.snapTime[camera] = world.time.elapsed + 3000;
      }

      if (clicked(CameraTool.recVideoRef[camera])) {
        CameraTool.state[camera] = CAMERA_STATE.COUNTDOWN_VIDEO;
        CameraTool.snapTime[camera] = world.time.elapsed + 3000;
      }

      if (clicked(CameraTool.button_next[camera])) {
        CameraTool.captureDurIdx[camera] = (CameraTool.captureDurIdx[camera] + 1) % CAPTURE_DURATIONS.length;
      }

      if (clicked(CameraTool.button_prev[camera])) {
        CameraTool.captureDurIdx[camera] = (CameraTool.captureDurIdx[camera] - 1) % CAPTURE_DURATIONS.length;
      }
    }

    if (
      CameraTool.state[camera] === CAMERA_STATE.COUNTDOWN_PHOTO ||
      CameraTool.state[camera] === CAMERA_STATE.COUNTDOWN_VIDEO
    ) {
      if (clicked(CameraTool.cancelRef[camera])) {
        CameraTool.state[camera] = CAMERA_STATE.IDLE;
      } else if (world.time.elapsed >= CameraTool.snapTime[camera]) {
        if (CameraTool.state[camera] === CAMERA_STATE.COUNTDOWN_VIDEO) {
          CameraTool.state[camera] = CAMERA_STATE.RECORDING_VIDEO;
          // setup video recording
          beginRecording(world, camera);
          CameraTool.snapTime[camera] = world.time.elapsed + CAPTURE_DURATIONS[CameraTool.captureDurIdx[camera]] * 1000;
        } else {
          CameraTool.state[camera] = CAMERA_STATE.SNAP_PHOTO;
        }
      } else {
        // Floating point imprecision: Add epsilon to elapsed time so that the countdown sound always plays on the same frame that we click
        const elapsed = world.time.elapsed + 0.01;
        const msRemaining = CameraTool.snapTime[camera] - elapsed;
        const msRemainingLastFrame = CameraTool.snapTime[camera] - (elapsed - world.time.delta);
        if (Math.floor(msRemaining / 1000) !== Math.floor(msRemainingLastFrame / 1000)) {
          console.log(msRemainingLastFrame, msRemaining);
          AFRAME.scenes[0].systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CAMERA_TOOL_COUNTDOWN);
        }
      }
    }

    // TODO we previously did this in tock() since we wanted to run it late in the frame
    // We actually want to run this before the normal scene render otherwise the camera view is a frame behind.
    // This is not really a big deal since we also run the camera at a lower FPS anyway
    // TODO limit camera FPS and/or limit how many cameras we render per frame
    updateRenderTarget(world, camera);

    if (CameraTool.state[camera] === CAMERA_STATE.SNAP_PHOTO) {
      console.log("Snap photo");
      captureSnapshot(world, camera);
      CameraTool.state[camera] = CAMERA_STATE.IDLE;
    } else if (CameraTool.state[camera] === CAMERA_STATE.RECORDING_VIDEO) {
      if (clicked(CameraTool.cancelRef[camera])) {
        console.log("Cancel video");
        CameraTool.state[camera] = CAMERA_STATE.IDLE;
        endRecording(world, camera, true);
      } else if (world.time.elapsed >= CameraTool.snapTime[camera]) {
        console.log("done recording");
        CameraTool.state[camera] = CAMERA_STATE.IDLE;
        endRecording(world, camera, false);
      } else {
        // TODO should only copy at VIDEO_FPS
        // also use CanvasCaptureMediaStreamTrack to sync when available
        copyVideoFrame(world, camera);
      }
    }

    updateUI(world, camera);
  });
}
