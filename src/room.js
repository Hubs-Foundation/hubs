import "./room.css";
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
import "webrtc-adapter";

import { vive_trackpad_dpad4 } from "./behaviours/vive-trackpad-dpad4";
import { oculus_touch_joystick_dpad4 } from "./behaviours/oculus-touch-joystick-dpad4";
import { PressedMove } from "./activators/pressedmove";
import { ReverseY } from "./activators/reversey";
import "./activators/shortpress";

import "./components/wasd-to-analog2d"; //Might be a behaviour or activator in the future
import "./components/mute-mic";
import "./components/audio-feedback";
import "./components/bone-mute-state-indicator";
import "./components/2d-mute-state-indicator";
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
import "./components/animated-robot-hands";
import "./components/hide-when-quality";
import "./components/animation-mixer";
import "./components/loop-animation";

import ReactDOM from "react-dom";
import React from "react";
import UIRoot from "./react-components/ui-root";

import "./systems/personal-space-bubble";

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

import "./elements/a-progressive-asset";

import "aframe-physics-system";
import "aframe-physics-extras";
import "super-hands";
import "./components/super-networked-interactable";
import "./components/networked-counter";
import "./components/super-spawner";
import "./components/super-cursor";
import "./components/event-repeater";

import registerNetworkSchemas from "./network-schemas";
import { inGameActions, config as inputConfig } from "./input-mappings";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";

import { generateDefaultProfile } from "./utils/identity.js";
import { getAvailableVREntryTypes } from "./utils/vr-caps-detect.js";
import ConcurrentLoadDetector from "./utils/concurrent-load-detector.js";

registerTelemetry();

const store = new Store();
const concurrentLoadDetector = new ConcurrentLoadDetector();
concurrentLoadDetector.start();

// Always layer in any new default profile bits
store.update({ profile:  { ...generateDefaultProfile(), ...(store.state.profile || {}) }})

async function shareMedia(audio, video) {
  const constraints = {
    audio: !!audio,
    video: video ? { mediaSource: "screen", height: 720, frameRate: 30 } : false
  };
  const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
  NAF.connection.adapter.setLocalMediaStream(mediaStream);

  const id = `${NAF.clientId}-screen`;
  let entity = document.getElementById(id);
  if (entity) {
    entity.setAttribute("visible", !!video);
  } else if (video) {
    const sceneEl = document.querySelector("a-scene");
    entity = document.createElement("a-entity");
    entity.id = id;
    entity.setAttribute("offset-relative-to", {
      target: "#player-camera",
      offset: "0 0 -2",
      on: "action_share_screen"
    });
    entity.setAttribute("networked", { template: "#video-template" });
    sceneEl.appendChild(entity);
  }
}

async function exitScene() {
  const scene = document.querySelector("a-scene");
  scene.renderer.animate(null); // Stop animation loop, TODO A-Frame should do this
  document.body.removeChild(scene);
}

function setNameTagFromStore() {
  const myNametag = document.querySelector("#player-rig .nametag");
  myNametag.setAttribute("text", "value", store.state.profile.display_name);
}

async function enterScene(mediaStream, enterInVR) {
  const scene = document.querySelector("a-scene");

  if (enterInVR) {
    scene.enterVR();
  }

  AFRAME.registerInputBehaviour("vive_trackpad_dpad4", vive_trackpad_dpad4);
  AFRAME.registerInputBehaviour("oculus_touch_joystick_dpad4", oculus_touch_joystick_dpad4);
  AFRAME.registerInputActivator("pressedmove", PressedMove);
  AFRAME.registerInputActivator("reverseY", ReverseY);
  AFRAME.registerInputActions(inGameActions, "default");
  AFRAME.registerInputMappings(inputConfig);
  document.querySelector("#player-camera").setAttribute("look-controls", "");

  const qs = queryString.parse(location.search);

  scene.setAttribute("networked-scene", {
    room: qs.room && !isNaN(parseInt(qs.room)) ? parseInt(qs.room) : 1,
    serverURL: process.env.JANUS_SERVER
  });

  if (!qs.stats || !/off|false|0/.test(qs.stats)) {
    scene.setAttribute("stats", true);
  }

  if (isMobile || qs.mobile) {
    const playerRig = document.querySelector("#player-rig");
    playerRig.setAttribute("virtual-gamepad-controls", {});
  }

  setNameTagFromStore();
  store.subscribe(setNameTagFromStore);

  const avatarScale = parseInt(qs.avatarScale, 10);

  if (avatarScale) {
    playerRig.setAttribute("scale", { x: avatarScale, y: avatarScale, z: avatarScale });
  }

  let sharingScreen = false;

  // TODO remove
  scene.addEventListener("action_share_screen", () => {
    sharingScreen = !sharingScreen;
    shareMedia(true, sharingScreen);
  });

  if (qs.offline) {
    onConnect();
  } else {
    document.body.addEventListener("connected", onConnect);

    scene.components["networked-scene"].connect();

    if (mediaStream) {
      NAF.connection.adapter.setLocalMediaStream(mediaStream);

      const hasVideo = !!(mediaStream.getVideoTracks().length > 0);

      const id = `${NAF.clientId}-screen`;
      let entity = document.getElementById(id);
      if (entity) {
        entity.setAttribute("visible", hasVideo);
      } else if (hasVideo) {
        const sceneEl = document.querySelector("a-scene");
        entity = document.createElement("a-entity");
        entity.id = id;
        entity.setAttribute("offset-relative-to", {
          target: "#head",
          offset: "0 0 -2",
          on: "action_share_screen"
        });
        entity.setAttribute("networked", { template: "#video-template" });
        sceneEl.appendChild(entity);
      }
    }
  }
}

function onConnect() {
  document.getElementById("loader").style.display = "none";
}

function mountUI(scene) {
  getAvailableVREntryTypes().then(availableVREntryTypes => {
    const qs = queryString.parse(location.search);
    const disableAutoExitOnConcurrentLoad = qs.allow_multi === "true"
    let forcedVREntryType = null;

    if (qs.vr_entry_type) {
      forcedVREntryType = qs.vr_entry_type;
    }

    ReactDOM.render(<UIRoot {...{
      availableVREntryTypes,
      scene,
      enterScene,
      exitScene,
      concurrentLoadDetector,
      disableAutoExitOnConcurrentLoad,
      forcedVREntryType,
      store
    }} />, document.getElementById("ui-root"));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  registerNetworkSchemas();

  const scene = document.querySelector("a-scene");
  window.APP.scene = scene;
  mountUI(scene);
});
