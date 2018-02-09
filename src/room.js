import queryString from "query-string";

import { patchWebGLRenderingContext } from "./utils/webgl";
patchWebGLRenderingContext();

import "aframe";
import "./vendor/GLTFLoader";
import "networked-aframe";
import "naf-janus-adapter";
import "aframe-teleport-controls";
import "aframe-input-mapping-component";

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
import "./components/nametag-transform";
import "./components/bone-mute-state-indicator";
import "./components/2d-mute-state-indicator";
import "./components/virtual-gamepad-controls";
import "./components/body-controller";
import "./components/hand-controls2";
import "./components/character-controller";
import "./components/haptic-feedback";
import "./components/networked-video-player";
import "./components/offset-relative-to";
import "./components/cached-gltf-model";
import "./components/water";
import "./components/skybox";
import "./components/layers";
import "./components/spawn-controller";
import "./components/model-inflator";
import "./components/spin";
import "./components/bone-visibility";
import "./components/camera-scale";

import "./systems/personal-space-bubble";

import "./elements/a-gltf-entity";
import "./elements/a-proxy-entity";

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

function shareScreen() {
  const track = NAF.connection.adapter.localMediaStream.getVideoTracks()[0];

  const id = `${NAF.clientId}-screen`;
  let entity = document.getElementById(id);
  if (!entity) {
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

  track.enabled = !track.enabled;
  entity.setAttribute("visible", track.enabled);
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
        console.log(playerRig);
        const myNametag = playerRig.querySelector(".nametag");
        myNametag.setAttribute("text", "value", username);
      },
      { once: true }
    );

    scene.addEventListener("action_share_screen", shareScreen);

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: qs.screen === "true" ? { mediaSource: "screen", height: 720, frameRate: 30 } : false
    });

    // Don't send video by deafult
    const videoTracks = mediaStream.getVideoTracks();
    if (videoTracks.length) {
      videoTracks[0].enabled = false;
    }

    if (qs.offline) {
      App.onConnect();
    } else {
      scene.components["networked-scene"].connect();

      // @TODO ideally the adapter should exist before connect, but it currently doesnt so we have to do this after calling connect. This might be a race condition in other adapters.
      NAF.connection.adapter.setLocalMediaStream(mediaStream);

      document.body.addEventListener("connected", App.onConnect);
    }
  },

  onConnect() {
    document.getElementById("loader").style.display = "none";
  }
};
