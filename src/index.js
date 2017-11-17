import queryString from "query-string";

import "aframe";
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
import "./systems/personal-space-bubble";

import registerNetworkScheams from "./network-schemas";
import registerInputMappings from "./input-mappings";
import { promptForName, getCookie, parseJwt } from "./utils";
import Config from "./config";

registerNetworkScheams();
registerInputMappings();

window.App = {
  onSceneLoad() {
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

    let username;
    const jwt = getCookie("jwt");
    if (jwt) {
      const data = parseJwt(jwt);
      username = data.typ.name;
      alert("Your username is: " + username);
    } else {
      let username = qs.name;
      if (!username) {
        username = promptForName(username); // promptForName is blocking
      }
    }

    const myNametag = document.querySelector("#player-rig .nametag");
    myNametag.setAttribute("text", "value", username);

    document.body.addEventListener("connected", App.onConnect);

    scene.components["networked-scene"].connect();
  },

  onConnect() {
    document.getElementById("loader").style.display = "none";
  }
};
