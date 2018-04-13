import "./assets/stylesheets/hub.scss";
import queryString from "query-string";

import { patchWebGLRenderingContext } from "./utils/webgl";
patchWebGLRenderingContext();

import "aframe-xr";
import "./vendor/GLTFLoader";
import "networked-aframe";
import "naf-janus-adapter";
import "aframe-teleport-controls";
import "aframe-input-mapping-component";
import "aframe-billboard-component";
import "aframe-rounded";
import "webrtc-adapter";

import trackpad_dpad4 from "./behaviours/trackpad-dpad4";
import joystick_dpad4 from "./behaviours/joystick-dpad4";
import { PressedMove } from "./activators/pressedmove";
import { ReverseY } from "./activators/reversey";
import "./activators/shortpress";

import "./components/wasd-to-analog2d"; //Might be a behaviour or activator in the future
import "./components/mute-mic";
import "./components/audio-feedback";
import "./components/bone-mute-state-indicator";
import "./components/bone-visibility";
import "./components/in-world-hud";
import "./components/virtual-gamepad-controls";
import "./components/ik-controller";
import "./components/hand-controls2";
import "./components/character-controller";
import "./components/haptic-feedback";
import "./components/networked-video-player";
import "./components/offset-relative-to";
import "./components/water";
import "./components/skybox";
import "./components/layers";
import "./components/spawn-controller";
import "./components/hide-when-quality";
import "./components/player-info";
import "./components/debug";
import "./components/animation-mixer";
import "./components/loop-animation";
import "./components/hand-poses";
import "./components/gltf-model-plus";
import "./components/gltf-bundle";
import "./components/hud-controller";

import ReactDOM from "react-dom";
import React from "react";
import UIRoot from "./react-components/ui-root";

import "./systems/personal-space-bubble";
import "./systems/app-mode";

import "./gltf-component-mappings";

import { App } from "./App";

window.APP = new App();

const qs = queryString.parse(location.search);
const isMobile = AFRAME.utils.device.isMobile();

if (qs.quality) {
  window.APP.quality = qs.quality;
} else {
  window.APP.quality = isMobile ? "low" : "high";
}

import "aframe-physics-system";
import "aframe-physics-extras";
import "aframe-extras/src/pathfinding";
import "super-hands";
import "./components/super-networked-interactable";
import "./components/networked-counter";
import "./components/super-spawner";
import "./components/super-cursor";
import "./components/event-repeater";

import "./components/nav-mesh-helper";

import registerNetworkSchemas from "./network-schemas";
import { inGameActions, config as inputConfig } from "./input-mappings";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";

import { generateDefaultProfile } from "./utils/identity.js";
import { getAvailableVREntryTypes } from "./utils/vr-caps-detect.js";
import ConcurrentLoadDetector from "./utils/concurrent-load-detector.js";

function qsTruthy(param) {
  const val = qs[param];
  // if the param exists but is not set (e.g. "?foo&bar"), its value is null.
  return val === null || /1|on|true/i.test(val);
}

registerTelemetry();

AFRAME.registerInputBehaviour("trackpad_dpad4", trackpad_dpad4);
AFRAME.registerInputBehaviour("joystick_dpad4", joystick_dpad4);
AFRAME.registerInputActivator("pressedmove", PressedMove);
AFRAME.registerInputActivator("reverseY", ReverseY);
AFRAME.registerInputMappings(inputConfig, true);

const store = new Store();
const concurrentLoadDetector = new ConcurrentLoadDetector();

concurrentLoadDetector.start();

// Always layer in any new default profile bits
store.update({ profile: { ...generateDefaultProfile(), ...(store.state.profile || {}) } });

async function exitScene() {
  const scene = document.querySelector("a-scene");
  scene.renderer.animate(null); // Stop animation loop, TODO A-Frame should do this
  document.body.removeChild(scene);
}

function applyProfileFromStore(playerRig) {
  const displayName = store.state.profile.display_name;
  playerRig.setAttribute("player-info", {
    displayName,
    avatarSrc: "#" + (store.state.profile.avatar_id || "botdefault")
  });
  document.querySelector("a-scene").emit("username-changed", { username: displayName });
}

async function enterScene(mediaStream, enterInVR, janusRoomId) {
  const scene = document.querySelector("a-scene");
  const playerRig = document.querySelector("#player-rig");
  document.querySelector("a-scene canvas").classList.remove("blurred");
  scene.render();

  if (enterInVR) {
    scene.enterVR();
  }

  AFRAME.registerInputActions(inGameActions, "default");

  document.querySelector("#player-camera").setAttribute("look-controls", "");

  scene.setAttribute("networked-scene", {
    room: janusRoomId,
    serverURL: process.env.JANUS_SERVER
  });

  if (!qsTruthy("no_stats")) {
    scene.setAttribute("stats", true);
  }

  if (isMobile || qsTruthy("mobile")) {
    playerRig.setAttribute("virtual-gamepad-controls", {});
  }

  const applyProfileOnPlayerRig = applyProfileFromStore.bind(null, playerRig);
  applyProfileOnPlayerRig();
  store.addEventListener("statechanged", applyProfileOnPlayerRig);

  const avatarScale = parseInt(qs.avatar_scale, 10);

  if (avatarScale) {
    playerRig.setAttribute("scale", { x: avatarScale, y: avatarScale, z: avatarScale });
  }

  const videoTracks = mediaStream.getVideoTracks();
  let sharingScreen = videoTracks.length > 0;

  const screenEntityId = `${NAF.clientId}-screen`;
  let screenEntity = document.getElementById(screenEntityId);

  scene.addEventListener("action_share_screen", () => {
    sharingScreen = !sharingScreen;
    if (sharingScreen) {
      for (const track of videoTracks) {
        mediaStream.addTrack(track);
      }
    } else {
      for (const track of mediaStream.getVideoTracks()) {
        mediaStream.removeTrack(track);
      }
    }
    NAF.connection.adapter.setLocalMediaStream(mediaStream);
    screenEntity.setAttribute("visible", sharingScreen);
  });

  if (!qsTruthy("offline")) {
    const connectPromise = scene.components["networked-scene"].connect();

    if (mediaStream) {
      NAF.connection.adapter.setLocalMediaStream(mediaStream);

      if (screenEntity) {
        screenEntity.setAttribute("visible", sharingScreen);
      } else if (sharingScreen) {
        const sceneEl = document.querySelector("a-scene");
        screenEntity = document.createElement("a-entity");
        screenEntity.id = screenEntityId;
        screenEntity.setAttribute("offset-relative-to", {
          target: "#player-camera",
          offset: "0 0 -2",
          on: "action_share_screen"
        });
        screenEntity.setAttribute("networked", { template: "#video-template" });
        sceneEl.appendChild(screenEntity);
      }
    }
    return connectPromise;
  } else {
    return Promise.resolve();
  }
}

function mountUI(scene) {
  const disableAutoExitOnConcurrentLoad = qsTruthy("allow_multi");
  const forcedVREntryType = qs.vr_entry_type || null;
  const enableScreenSharing = qsTruthy("enable_screen_sharing");
  const htmlPrefix = document.body.dataset.htmlPrefix || "";

  // TODO: Refactor to avoid using return value
  /* eslint-disable react/no-render-return-value */
  const uiRoot = ReactDOM.render(
    <UIRoot
      {...{
        scene,
        enterScene,
        exitScene,
        concurrentLoadDetector,
        disableAutoExitOnConcurrentLoad,
        forcedVREntryType,
        enableScreenSharing,
        store,
        htmlPrefix
      }}
    />,
    document.getElementById("ui-root")
  );
  /* eslint-enable react/no-render-return-value */

  return uiRoot;
}

const onReady = async () => {
  const scene = document.querySelector("a-scene");
  document.querySelector("a-scene canvas").classList.add("blurred");
  window.APP.scene = scene;

  registerNetworkSchemas();

  const uiRoot = mountUI(scene);

  getAvailableVREntryTypes().then(availableVREntryTypes => {
    uiRoot.setState({ availableVREntryTypes });
    uiRoot.handleForcedVREntryType();
  });

  const environmentRoot = document.querySelector("#environment-root");

  const initialEnvironmentEl = document.createElement("a-entity");
  initialEnvironmentEl.addEventListener("bundleloaded", () => {
    uiRoot.setState({ initialEnvironmentLoaded: true });
    // Wait a tick so that the environments actually render.
    setTimeout(() => scene.renderer.animate(null));
  });
  environmentRoot.appendChild(initialEnvironmentEl);

  if (qs.room) {
    // If ?room is set, this is `yarn start`, so just use a default environment and query string room.
    uiRoot.setState({ janusRoomId: qs.room && !isNaN(parseInt(qs.room)) ? parseInt(qs.room) : 1 });
    initialEnvironmentEl.setAttribute("gltf-bundle", {
      src: "https://asset-bundles-prod.reticulum.io/rooms/meetingroom/MeetingRoom.bundle.json"
      // src: "https://asset-bundles-prod.reticulum.io/rooms/theater/TheaterMeshes.bundle.json"
      // src: "https://asset-bundles-prod.reticulum.io/rooms/atrium/AtriumMeshes.bundle.json"
      // src: "https://asset-bundles-prod.reticulum.io/rooms/courtyard/CourtyardMeshes.bundle.json"
    });
    return;
  }

  const hubId = document.location.pathname.substring(1).split("/")[0];
  console.log(`Hub ID: ${hubId}`);
  const res = await fetch(`/api/v1/hubs/${hubId}`);
  const data = await res.json();
  const hub = data.hubs[0];
  const defaultSpaceTopic = hub.topics[0];
  const gltfBundleUrl = defaultSpaceTopic.assets.find(a => a.asset_type === "gltf_bundle").src;
  uiRoot.setState({ janusRoomId: defaultSpaceTopic.janus_room_id });
  initialEnvironmentEl.setAttribute("gltf-bundle", `src: ${gltfBundleUrl}`);
};

document.addEventListener("DOMContentLoaded", onReady);
