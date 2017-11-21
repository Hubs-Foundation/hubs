import queryString from "query-string";

import "aframe";
import "./vendor/GLTFLoader";
import "networked-aframe";
import "naf-janus-adapter";
import "aframe-teleport-controls";
import "aframe-input-mapping-component";

import animationMixer from "aframe-extras/src/loaders/animation-mixer";
AFRAME.registerComponent("animation-mixer", animationMixer);

import "./components/axis-dpad";
import "./components/mute-mic";
import "./components/audio-feedback";
import "./components/nametag-transform";
import "./components/mute-state-indicator";
import "./components/virtual-gamepad-controls";
import "./components/body-controller";
import "./components/hand-controls2";
import "./components/character-controller";
import "./components/split-axis-events";
import "./components/networked-video-player";
import "./components/offset-relative-to";
import "./systems/personal-space-bubble";

import registerNetworkScheams from "./network-schemas";
import registerInputMappings from "./input-mappings";
import { promptForName } from "./utils";
import Config from "./config";

registerNetworkScheams();
registerInputMappings();

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
      room:
        qs.room && !isNaN(parseInt(qs.room))
          ? parseInt(qs.room)
          : Config.default_room,
      serverURL: Config.janus_server_url
    });

    if (!qs.stats || !/off|false|0/.test(qs.stats)) {
      scene.setAttribute("stats", true);
    }

    if (AFRAME.utils.device.isMobile() || qs.gamepad) {
      const playerRig = document.querySelector("#player-rig");
      playerRig.setAttribute("virtual-gamepad-controls", {});
    }

    let username = qs.name;
    if (!username) {
      username = promptForName(username); // promptForName is blocking
    }
    const myNametag = document.querySelector("#player-rig .nametag");
    myNametag.setAttribute("text", "value", username);

    document.body.addEventListener("connected", App.onConnect);

    scene.addEventListener("action_share_screen", shareScreen);

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video:
        qs.screen === "true"
          ? { mediaSource: "screen", height: 720, frameRate: 30 }
          : false
    });

    // Don't send video by deafult
    const videoTracks = mediaStream.getVideoTracks();
    if (videoTracks.length) {
      videoTracks[0].enabled = false;
    }

    scene.components["networked-scene"].connect();
    // @TODO ideally the adapter should exist before connect, but it currently doesnt so we have to do this after calling connect. This might be a race condition in other adapters.
    NAF.connection.adapter.setLocalMediaStream(mediaStream);
  },

  onConnect() {
    document.getElementById("loader").style.display = "none";
  }
};
