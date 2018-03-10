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

import animationMixer from "aframe-extras/src/loaders/animation-mixer";
AFRAME.registerComponent("animation-mixer", animationMixer);

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

import ReactDOM from "react-dom";
import React from "react";
import UIRoot from "./react-components/ui-root";

import "./systems/personal-space-bubble";

import "./elements/a-gltf-entity";

import registerNetworkSchemas from "./network-schemas";
import { inGameActions, config } from "./input-mappings";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";

import { generateDefaultProfile } from "./utils/identity.js";
import { getAvailableVREntryTypes } from "./utils/vr-caps-detect.js";

AFRAME.registerInputBehaviour("vive_trackpad_dpad4", vive_trackpad_dpad4);
AFRAME.registerInputBehaviour("oculus_touch_joystick_dpad4", oculus_touch_joystick_dpad4);
AFRAME.registerInputActivator("pressedmove", PressedMove);
AFRAME.registerInputActivator("reverseY", ReverseY);
AFRAME.registerInputActions(inGameActions, "default");
AFRAME.registerInputMappings(config);

registerNetworkSchemas();
registerTelemetry();

const store = new Store();

// Always layer in any new default profile bits
store.update({ profile:  { ...generateDefaultProfile(), ...(store.state.profile || {}) }})

async function enterScene(mediaStream) {
  const qs = queryString.parse(location.search);
  const scene = document.querySelector("a-scene");

  scene.setAttribute("networked-scene", {
    room: qs.room && !isNaN(parseInt(qs.room)) ? parseInt(qs.room) : 1,
    serverURL: process.env.JANUS_SERVER
  });

  if (!qs.stats || !/off|false|0/.test(qs.stats)) {
    scene.setAttribute("stats", true);
  }

  if (AFRAME.utils.device.isMobile() || qs.gamepad) {
    const playerRig = document.querySelector("#player-rig");
    playerRig.setAttribute("virtual-gamepad-controls", {});
  }

  const myNametag = document.querySelector("#player-rig .nametag");
  myNametag.setAttribute("text", "value", store.state.profile.display_name);

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

function mountUI() {
  getAvailableVREntryTypes().then(availableVREntryTypes => {
    ReactDOM.render(<UIRoot {...{ availableVREntryTypes, enterScene }} />, document.getElementById("ui-root"));
    document.getElementById("loader").style.display = "none";
  });
}

document.addEventListener("DOMContentLoaded", () => mountUI());
