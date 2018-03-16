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

import { promptForName, getCookie, parseJwt } from "./utils/identity";
import registerNetworkSchemas from "./network-schemas";
import { inGameActions, config } from "./input-mappings";
import registerTelemetry from "./telemetry";

AFRAME.registerInputBehaviour("vive_trackpad_dpad4", vive_trackpad_dpad4);
AFRAME.registerInputBehaviour("oculus_touch_joystick_dpad4", oculus_touch_joystick_dpad4);
AFRAME.registerInputActivator("pressedmove", PressedMove);
AFRAME.registerInputActivator("reverseY", ReverseY);
AFRAME.registerInputActions(inGameActions, "default");
AFRAME.registerInputMappings(config);

registerNetworkSchemas();
registerTelemetry();

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

async function onSceneLoad() {
  const scene = document.querySelector("a-scene");

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

  let username;
  const jwt = getCookie("jwt");
  if (jwt) {
    //grab name from jwt
    const data = parseJwt(jwt);
    username = data.typ.name;
  }

  if (qs.name) {
    username = qs.name; //always override with name from querystring if available
  } else {
    username = promptForName(username); // promptForName is blocking
  }

  const myNametag = document.querySelector("#player-rig .nametag");
  myNametag.setAttribute("text", "value", username);

  const avatarScale = parseInt(qs.avatarScale, 10);

  if (avatarScale) {
    playerRig.setAttribute("scale", { x: avatarScale, y: avatarScale, z: avatarScale });
  }

  let sharingScreen = false;
  scene.addEventListener("action_share_screen", () => {
    sharingScreen = !sharingScreen;
    shareMedia(true, sharingScreen);
  });

  if (qs.offline) {
    onConnect();
  } else {
    document.body.addEventListener("connected", onConnect);

    scene.components["networked-scene"].connect();

    await shareMedia(true, sharingScreen);
  }
}

function onConnect() {
  document.getElementById("loader").style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  const scene = document.querySelector("a-scene");

  window.APP.scene = scene;

  scene.addEventListener("loaded", onSceneLoad);
});
