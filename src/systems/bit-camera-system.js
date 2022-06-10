import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import {
  CameraTool,
  HeldHandLeft,
  HeldHandRight,
  HeldRemoteLeft,
  HeldRemoteRight,
  Interacted
} from "../bit-components";
import { addMedia } from "../utils/media-utils";
import { pixelsToPNG, RenderTargetRecorder } from "../utils/render-target-recorder";
import { isFacingCamera } from "../utils/three-utils";
import { SOUND_CAMERA_TOOL_COUNTDOWN, SOUND_CAMERA_TOOL_TOOK_SNAPSHOT } from "./sound-effects-system";
import { paths } from "./userinput/paths";

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
const VIEWFINDER_UPDATE_RATE = 1000 / 6;
const VIDEO_UPDATE_RATE = 1000 / VIDEO_FPS;

const CAMERA_STATE = {
  IDLE: 0,
  COUNTDOWN_PHOTO: 1,
  COUNTDOWN_VIDEO: 2,
  SNAP_PHOTO: 3,
  RECORDING_VIDEO: 4
};

const CAPTURE_DURATIONS = [3, 7, 15, 30, 60];

const renderTargets = new Map();
const videoRecorders = new Map();

function clicked(eid) {
  return hasComponent(APP.world, Interacted, eid);
}

function grabberPressedSnapAction(world, camera) {
  const userinput = AFRAME.scenes[0].systems.userinput;
  return (
    (hasComponent(world, HeldRemoteLeft, camera) && userinput.get(paths.actions.cursor.left.takeSnapshot)) ||
    (hasComponent(world, HeldRemoteRight, camera) && userinput.get(paths.actions.cursor.right.takeSnapshot)) ||
    (hasComponent(world, HeldHandLeft, camera) && userinput.get(paths.actions.leftHand.takeSnapshot)) ||
    (hasComponent(world, HeldHandRight, camera) && userinput.get(paths.actions.rightHand.takeSnapshot))
    // userinput.get(paths.actions.takeSnapshot)
  );
}

function createRecorder(captureAudio) {
  let srcAudioTrack;
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
    srcAudioTrack = destination.stream.getAudioTracks()[0];
  }

  return new RenderTargetRecorder(
    AFRAME.scenes[0].renderer,
    videoMimeType,
    CAPTURE_WIDTH,
    CAPTURE_HEIGHT,
    VIDEO_FPS,
    srcAudioTrack
  );
}

function endRecording(world, eid, cancel) {
  const recorder = videoRecorders.get(eid);
  if (cancel) {
    recorder.cancel();
  } else {
    recorder.save().then(file => {
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

      // entity.addEventListener(
      //   "video-loaded",
      //   () => {
      //     // If we were recording audio, then pause the video immediately after starting.

      //     // Or, to limit the # of concurrent videos playing, if it was a short clip, let it loop
      //     // a few times and then pause it.
      //     if (captureAudio || recordingDuration <= MAX_DURATION_TO_LIMIT_LOOPS * 1000) {
      //       setTimeout(() => {
      //         if (!NAF.utils.isMine(entity) && !NAF.utils.takeOwnership(entity)) return;
      //         entity.components["media-video"].tryUpdateVideoPlaybackState(true);
      //       }, captureAudio ? 0 : recordingDuration * VIDEO_LOOPS + 100);
      //     }
      //   },
      //   { once: true }
      // );

      // this.localSnapCount++;

      // orientation.then(() => this.el.sceneEl.emit("object_spawned", { objectType: ObjectTypes.CAMERA }));
    });
  }
  videoRecorders.delete(eid);
  APP.hubChannel.endRecording();
}

function updateRenderTarget(world, camera) {
  const sceneEl = AFRAME.scenes[0];
  const renderer = AFRAME.scenes[0].renderer;

  const tmpVRFlag = renderer.xr.enabled;
  renderer.xr.enabled = false;

  // TODO we are doing this because aframe uses this hook for tock.
  // Namely to capture what camera was rendering. We don't actually use that in any of our tocks.
  // Also tock can likely go away as a concept since we can just direclty order things after render in raf if we want to.
  const tmpOnAfterRender = sceneEl.object3D.onAfterRender;
  delete sceneEl.object3D.onAfterRender;

  // TODO this assumption is now not true since we are not running after render. We should probably just permentently turn of autoUpdate and run matrix updates at a point we wnat to.
  // The entire scene graph matrices should already be updated
  // in tick(). They don't need to be recomputed again in tock().
  const tmpAutoUpdate = sceneEl.object3D.autoUpdate;
  sceneEl.object3D.autoUpdate = false;

  const renderTarget = renderTargets.get(camera);
  renderTarget.needsUpdate = false;
  renderTarget.lastUpdated = world.time.elapsed;

  renderer.setRenderTarget(renderTarget);
  renderer.render(sceneEl.object3D, world.eid2obj.get(CameraTool.cameraRef[camera]));
  renderer.setRenderTarget(null);

  renderer.xr.enabled = tmpVRFlag;
  sceneEl.object3D.onAfterRender = tmpOnAfterRender;
  sceneEl.object3D.autoUpdate = tmpAutoUpdate;
}

function updateUI(world, camera) {
  const snapMenuObj = world.eid2obj.get(CameraTool.snapMenuRef[camera]);
  const snapBtnObj = world.eid2obj.get(CameraTool.snapRef[camera]);
  const recBtnObj = world.eid2obj.get(CameraTool.recVideoRef[camera]);
  const cancelBtnObj = world.eid2obj.get(CameraTool.cancelRef[camera]);
  const nextBtnObj = world.eid2obj.get(CameraTool.button_next[camera]);
  const prevBtnObj = world.eid2obj.get(CameraTool.button_prev[camera]);
  const countdownLblObj = world.eid2obj.get(CameraTool.countdownLblRef[camera]);
  const captureDurLblObj = world.eid2obj.get(CameraTool.captureDurLblRef[camera]);

  const isIdle = CameraTool.state[camera] === CAMERA_STATE.IDLE;
  const isCounting =
    CameraTool.state[camera] === CAMERA_STATE.COUNTDOWN_PHOTO ||
    CameraTool.state[camera] === CAMERA_STATE.COUNTDOWN_VIDEO ||
    CameraTool.state[camera] === CAMERA_STATE.RECORDING_VIDEO;

  const playerInFrontOfCamera = isFacingCamera(world.eid2obj.get(camera));

  const yRot = playerInFrontOfCamera ? 0 : Math.PI;
  if (snapMenuObj.rotation.y !== yRot) {
    snapMenuObj.rotation.y = yRot;
    snapMenuObj.matrixNeedsUpdate = true;
  }

  snapBtnObj.visible = isIdle;

  recBtnObj.visible = allowVideo && isIdle;
  captureDurLblObj.visible = allowVideo && isIdle;
  nextBtnObj.visible = allowVideo && isIdle;
  prevBtnObj.visible = allowVideo && isIdle;

  cancelBtnObj.visible = isCounting;
  countdownLblObj.visible = isCounting;

  if (countdownLblObj.visible) {
    const timeLeftSec = Math.ceil((CameraTool.snapTime[camera] - world.time.elapsed) / 1000);
    countdownLblObj.text = timeLeftSec;
    countdownLblObj.sync(); // TODO this should probably happen in 1 spot per frame for all Texts
  }

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

    renderTarget.lastUpdated = 0;

    // Bit of a hack here to only update the renderTarget when the screens are in view
    renderTarget.texture.isVideoTexture = true;
    renderTarget.texture.update = () => {
      renderTarget.needsUpdate = true;
    };

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

  cameraToolQuery(world).forEach((camera, i, allCameras) => {
    if (CameraTool.state[camera] === CAMERA_STATE.IDLE) {
      if (clicked(CameraTool.snapRef[camera]) || grabberPressedSnapAction(world, camera)) {
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
        CameraTool.captureDurIdx[camera] =
          CameraTool.captureDurIdx[camera] === 0 ? CAPTURE_DURATIONS.length - 1 : CameraTool.captureDurIdx[camera] - 1;
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
          CameraTool.snapTime[camera] = world.time.elapsed + CAPTURE_DURATIONS[CameraTool.captureDurIdx[camera]] * 1000;
          CameraTool.state[camera] = CAMERA_STATE.RECORDING_VIDEO;

          const recorder = createRecorder(false);
          videoRecorders.set(camera, recorder);
          recorder.start();

          APP.hubChannel.beginRecording();
        } else {
          CameraTool.state[camera] = CAMERA_STATE.SNAP_PHOTO;
        }
      } else {
        // Floating point imprecision: Add epsilon to elapsed time so that the countdown sound always plays on the same frame that we click
        const elapsed = world.time.elapsed + 0.01;
        const msRemaining = CameraTool.snapTime[camera] - elapsed;
        const msRemainingLastFrame = CameraTool.snapTime[camera] - (elapsed - world.time.delta);
        if (Math.floor(msRemaining / 1000) !== Math.floor(msRemainingLastFrame / 1000)) {
          AFRAME.scenes[0].systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CAMERA_TOOL_COUNTDOWN);
        }
      }
    }

    // TODO we previously did this in tock() since we wanted to run it late in the frame
    // We actually want to run this before the normal scene render otherwise the camera view is a frame behind.
    // This is not really a big deal since we also run the camera at a lower FPS anyway
    const renderTarget = renderTargets.get(camera);
    const elapsed = world.time.elapsed;

    // Update render target at a specific when taking a photo, recording a video, or round robbin for cameras in view
    if (
      CameraTool.state[camera] === CAMERA_STATE.SNAP_PHOTO ||
      (CameraTool.state[camera] === CAMERA_STATE.RECORDING_VIDEO &&
        elapsed > renderTarget.lastUpdated + VIDEO_UPDATE_RATE) ||
      (renderTarget.needsUpdate &&
        world.time.tick % allCameras.length === i &&
        elapsed > renderTarget.lastUpdated + VIEWFINDER_UPDATE_RATE)
    ) {
      updateRenderTarget(world, camera);
      if (CameraTool.state[camera] === CAMERA_STATE.RECORDING_VIDEO) {
        videoRecorders.get(camera).captureFrame(renderTargets.get(camera));
      }
    }

    if (CameraTool.state[camera] === CAMERA_STATE.SNAP_PHOTO) {
      captureSnapshot(world, camera);
      CameraTool.state[camera] = CAMERA_STATE.IDLE;
    } else if (CameraTool.state[camera] === CAMERA_STATE.RECORDING_VIDEO) {
      if (clicked(CameraTool.cancelRef[camera])) {
        endRecording(world, camera, true);
        CameraTool.state[camera] = CAMERA_STATE.IDLE;
      } else if (world.time.elapsed >= CameraTool.snapTime[camera]) {
        endRecording(world, camera, false);
        CameraTool.state[camera] = CAMERA_STATE.IDLE;
      }
    }

    updateUI(world, camera);
  });
}

// TODO focus/track
