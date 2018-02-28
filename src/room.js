import queryString from "query-string";

import { patchWebGLRenderingContext } from "./utils/webgl";
patchWebGLRenderingContext();

import "aframe-xr";
import "./vendor/GLTFLoader";
import "networked-aframe";
import "naf-janus-adapter";
import "aframe-teleport-controls";
import "aframe-input-mapping-component";
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
import "./components/billboard";
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
import "./components/bone-visibility";

import "./systems/personal-space-bubble";
import "./systems/app-mode";

import "./elements/a-gltf-entity";

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
      target: "#head",
      offset: "0 0 -2",
      on: "action_share_screen"
    });
    entity.setAttribute("networked", { template: "#video-template" });
    sceneEl.appendChild(entity);
  }
}

window.App = {
  async onSceneLoad() {
    const qs = queryString.parse(location.search);
    const scene = document.querySelector("a-scene");

    scene.setAttribute("networked-scene", {
      room: qs.room && !isNaN(parseInt(qs.room)) ? parseInt(qs.room) : window.CONFIG.default_room,
      serverURL: window.CONFIG.janus_server_url
    });

    if (!qs.stats || !/off|false|0/.test(qs.stats)) {
      scene.setAttribute("stats", true);
    }

    const playerRig = document.querySelector("#player-rig");

    if (AFRAME.utils.device.isMobile() || qs.gamepad) {
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

    playerRig.addEventListener(
      "model-loaded",
      () => {
        const myNametag = playerRig.querySelector(".nametag");
        myNametag.setAttribute("text", "value", username);

        const avatarScale = parseInt(qs.avatarScale, 10);

        if (avatarScale) {
          playerRig.setAttribute("scale", { x: avatarScale, y: avatarScale, z: avatarScale });
        }
      },
      { once: true }
    );

    let sharingScreen = false;
    scene.addEventListener("action_share_screen", () => {
      sharingScreen = !sharingScreen;
      shareMedia(true, sharingScreen);
    });

    if (qs.offline) {
      App.onConnect();
    } else {
      document.body.addEventListener("connected", App.onConnect);

      scene.components["networked-scene"].connect();

      await shareMedia(true, sharingScreen);
    }
  },

  onConnect() {
    document.getElementById("loader").style.display = "none";
  }
};
