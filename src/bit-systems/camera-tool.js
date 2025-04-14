import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent } from "bitecs";
import {
  CameraTool,
  Held,
  HeldHandLeft,
  HeldHandRight,
  HeldRemoteLeft,
  HeldRemoteRight,
  HoveredRemoteRight,
  Interacted,
  RemoteRight,
  TextButton
} from "../bit-components";
import { addMedia } from "../utils/media-utils";
import { pixelsToPNG, RenderTargetRecorder } from "../utils/render-target-recorder";
import { isFacingCamera } from "../utils/three-utils";
import { SOUND_CAMERA_TOOL_COUNTDOWN, SOUND_CAMERA_TOOL_TOOK_SNAPSHOT } from "../systems/sound-effects-system";
import { paths } from "../systems/userinput/paths";
import { ObjectTypes } from "../object-types";
import { anyEntityWith } from "../utils/bit-utils";
import { updateRenderTarget } from "./video-texture";

// Prefer h264 if available due to faster decoding speec on most platforms
const videoCodec = ["h264", "vp9,opus", "vp8,opus", "vp9", "vp8"].find(
  codec => window.MediaRecorder && MediaRecorder.isTypeSupported(`video/webm; codecs=${codec}`)
);
const videoMimeType = videoCodec ? `video/webm; codecs=${videoCodec}` : null;
const hasWebGL2 = !!document.createElement("canvas").getContext("webgl2");
const allowVideo = !!videoMimeType && hasWebGL2;

const RENDER_WIDTH = 1280;
const RENDER_HEIGHT = 720;

const isThisMobileVR = AFRAME.utils.device.isMobileVR();
const isOculusBrowser = navigator.userAgent.match(/Oculus/);
// TODO ported from old camera system. Do we still want these restrictions?
const CAPTURE_WIDTH = isThisMobileVR && !isOculusBrowser ? 640 : 1280;
const CAPTURE_HEIGHT = isThisMobileVR && !isOculusBrowser ? 360 : 720;

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
let captureAudio = false;

const tmpVec3 = new THREE.Vector3();

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

function spawnCameraFile(cameraObj, file, type) {
  const opts = type === "video" ? { videoPaused: true } : {};
  const { entity } = addMedia(file, "#interactable-media", undefined, `${type}-camera`, false, false, true, opts);
  entity.addEventListener(
    "media_resolved",
    () => {
      AFRAME.scenes[0].systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_CAMERA_TOOL_TOOK_SNAPSHOT);
      // TODO animate and orient around camera
      entity.object3D.position.copy(cameraObj.localToWorld(new THREE.Vector3(0, -0.5, 0)));
      entity.object3D.quaternion.copy(cameraObj.quaternion);
      entity.object3D.matrixNeedsUpdate = true;
      APP.hubChannel.sendMessage({ src: entity.components["media-loader"].data.src }, type);
      APP.hubChannel.sendObjectSpawnedEvent(ObjectTypes.CAMERA);
    },
    { once: true }
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
    context.createMediaStreamSource(new MediaStream([APP.dialog._micProducer?.track])).connect(destination);
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

function endRecording(world, camera, cancel) {
  const recorder = videoRecorders.get(camera);
  if (cancel) {
    recorder.cancel();
  } else {
    recorder.save().then(file => {
      spawnCameraFile(world.eid2obj.get(camera), file, "video");
    });
  }
  videoRecorders.delete(camera);
  APP.hubChannel.endRecording();
}

function updateUI(world, camera) {
  const snapMenuObj = world.eid2obj.get(CameraTool.snapMenuRef[camera]);
  const snapBtnObj = world.eid2obj.get(CameraTool.snapRef[camera]);
  const recBtnObj = world.eid2obj.get(CameraTool.recVideoRef[camera]);
  const cancelBtnObj = world.eid2obj.get(CameraTool.cancelRef[camera]);
  const nextBtnObj = world.eid2obj.get(CameraTool.nextButtonRef[camera]);
  const prevBtnObj = world.eid2obj.get(CameraTool.prevButtonRef[camera]);
  const countdownLblObj = world.eid2obj.get(CameraTool.countdownLblRef[camera]);
  const captureDurLblObj = world.eid2obj.get(CameraTool.captureDurLblRef[camera]);
  const screenObj = world.eid2obj.get(CameraTool.screenRef[camera]);
  const selfieScreenObj = world.eid2obj.get(CameraTool.selfieScreenRef[camera]);

  const sndToggleBtnObj = world.eid2obj.get(CameraTool.sndToggleRef[camera]);
  const sndToggleLblObj = world.eid2obj.get(TextButton.labelRef[CameraTool.sndToggleRef[camera]]);

  const isIdle = CameraTool.state[camera] === CAMERA_STATE.IDLE;
  const isCounting =
    CameraTool.state[camera] === CAMERA_STATE.COUNTDOWN_PHOTO ||
    CameraTool.state[camera] === CAMERA_STATE.COUNTDOWN_VIDEO ||
    CameraTool.state[camera] === CAMERA_STATE.RECORDING_VIDEO;

  const inVR = AFRAME.scenes[0].is("vr-mode");
  const showViewfinder = !inVR || hasComponent(world, Held, camera) || !isIdle;
  screenObj.visible = showViewfinder;
  selfieScreenObj.visible = showViewfinder;

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
  sndToggleBtnObj.visible = allowVideo && isIdle;

  cancelBtnObj.visible = isCounting;
  countdownLblObj.visible = isCounting;

  if (countdownLblObj.visible) {
    const timeLeftSec = Math.ceil((CameraTool.snapTime[camera] - world.time.elapsed) / 1000);
    countdownLblObj.text = timeLeftSec;
  }

  if (captureDurLblObj.visible) {
    captureDurLblObj.text = CAPTURE_DURATIONS[CameraTool.captureDurIdx[camera]];
  }

  if (sndToggleBtnObj.visible) {
    sndToggleLblObj.text = captureAudio ? "Sound ON" : "Sound OFF";
  }
}

let snapPixels;
function captureSnapshot(world, camera) {
  if (!snapPixels) {
    snapPixels = new Uint8Array(RENDER_WIDTH * RENDER_HEIGHT * 4);
  }
  const renderer = AFRAME.scenes[0].renderer;
  renderer.readRenderTargetPixels(renderTargets.get(camera), 0, 0, RENDER_WIDTH, RENDER_HEIGHT, snapPixels);
  pixelsToPNG(snapPixels, RENDER_WIDTH, RENDER_HEIGHT).then(file => {
    spawnCameraFile(world.eid2obj.get(camera), file, "photo");
  });
}

// TODO this should be its own thing, not hardcoded to camera tools or mouse bindings
function rotateWithRightClick(world, camera) {
  const userinput = AFRAME.scenes[0].systems.userinput;
  const transformSystem = AFRAME.scenes[0].systems["transform-selected-object"];
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  if (
    !transformSystem.transforming &&
    hasComponent(world, HoveredRemoteRight, camera) &&
    userinput.get(paths.device.mouse.buttonRight)
  ) {
    const rightCursor = anyEntityWith(world, RemoteRight);
    physicsSystem.updateRigidBody(camera, { type: "kinematic" });
    transformSystem.startTransform(world.eid2obj.get(camera), world.eid2obj.get(rightCursor), {
      mode: "cursor"
    });
  } else if (transformSystem.target?.eid === camera && !userinput.get(paths.device.mouse.buttonRight)) {
    transformSystem.stopTransform();
  }
}

const cameraToolQuery = defineQuery([CameraTool]);
const cameraToolEnterQuery = enterQuery(cameraToolQuery);
const cameraToolExitQuery = exitQuery(cameraToolQuery);

export function cameraToolSystem(world) {
  cameraToolEnterQuery(world).forEach(function (eid) {
    const renderTarget = new THREE.WebGLRenderTarget(RENDER_WIDTH, RENDER_HEIGHT, {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      encoding: THREE.sRGBEncoding
    });
    renderTarget.lastUpdated = 0;
    renderTarget.needsUpdate = true;

    // Only update the renderTarget when the screens are in view
    function setRendertargetDirty() {
      renderTarget.needsUpdate = true;
    }

    const screenObj = world.eid2obj.get(CameraTool.screenRef[eid]);
    screenObj.material.map = renderTarget.texture;
    screenObj.material.onBeforeRender = setRendertargetDirty;

    const selfieScreenObj = world.eid2obj.get(CameraTool.selfieScreenRef[eid]);
    selfieScreenObj.material.map = renderTarget.texture;
    selfieScreenObj.material.onBeforeRender = setRendertargetDirty;

    renderTargets.set(eid, renderTarget);
  });

  cameraToolExitQuery(world).forEach(function (eid) {
    const renderTarget = renderTargets.get(eid);
    renderTarget.dispose();
    renderTargets.delete(eid);

    const screenObj = world.eid2obj.get(CameraTool.screenRef[eid]);
    screenObj.geometry.dispose();
    screenObj.material.dispose();
  });

  cameraToolQuery(world).forEach((camera, i, allCameras) => {
    rotateWithRightClick(world, camera);

    if (CameraTool.trackTarget[camera]) {
      if (entityExists(world, CameraTool.trackTarget[camera])) {
        world.eid2obj.get(CameraTool.trackTarget[camera]).getWorldPosition(tmpVec3);
        world.eid2obj.get(camera).lookAt(tmpVec3);
      } else {
        CameraTool.trackTarget[camera] = 0;
      }
    }

    if (CameraTool.state[camera] === CAMERA_STATE.IDLE) {
      if (clicked(CameraTool.snapRef[camera]) || grabberPressedSnapAction(world, camera)) {
        CameraTool.state[camera] = CAMERA_STATE.COUNTDOWN_PHOTO;
        CameraTool.snapTime[camera] = world.time.elapsed + 3000;
      }

      if (clicked(CameraTool.recVideoRef[camera])) {
        CameraTool.state[camera] = CAMERA_STATE.COUNTDOWN_VIDEO;
        CameraTool.snapTime[camera] = world.time.elapsed + 3000;
      }

      if (clicked(CameraTool.nextButtonRef[camera])) {
        CameraTool.captureDurIdx[camera] = (CameraTool.captureDurIdx[camera] + 1) % CAPTURE_DURATIONS.length;
      }

      if (clicked(CameraTool.prevButtonRef[camera])) {
        CameraTool.captureDurIdx[camera] =
          CameraTool.captureDurIdx[camera] === 0 ? CAPTURE_DURATIONS.length - 1 : CameraTool.captureDurIdx[camera] - 1;
      }

      if (clicked(CameraTool.sndToggleRef[camera])) {
        captureAudio = !captureAudio;
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

          const recorder = createRecorder(captureAudio);
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

    // Update render target when taking a photo, recording a video, or round robbin for cameras in view
    if (
      CameraTool.state[camera] === CAMERA_STATE.SNAP_PHOTO ||
      (CameraTool.state[camera] === CAMERA_STATE.RECORDING_VIDEO &&
        elapsed > renderTarget.lastUpdated + VIDEO_UPDATE_RATE) ||
      (renderTarget.needsUpdate &&
        world.time.tick % allCameras.length === i &&
        elapsed > renderTarget.lastUpdated + VIEWFINDER_UPDATE_RATE)
    ) {
      // TODO camera tool may be able to just direclty use video-texture-target/source
      updateRenderTarget(world, renderTarget, CameraTool.cameraRef[camera]);
      renderTarget.needsUpdate = false;
      renderTarget.lastUpdated = world.time.elapsed;
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
