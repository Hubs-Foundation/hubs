import queryString from "query-string";

import "aframe";
import "networked-aframe";
import "naf-janus-adapter";
import "aframe-teleport-controls";
import "aframe-input-mapping-component";

import "./components/axis-dpad";
import "./components/mute-mic";
import "./components/audio-feedback";
import "./components/nametag-transform";
import "./components/avatar-customization";
import "./components/mute-state-indicator";
import "./components/hand-controls-visibility";
import "./components/character-controller";
import "./components/split-axis-events";
import "./components/virtual-gamepad-controls";
import "./systems/personal-space-bubble";

import registerNetworkScheams from "./network-schemas";
import registerInputMappings from "./input-mappings";
import { promptForName } from "./utils";
import Config from "./config";

registerNetworkScheams();
registerInputMappings();

window.onSceneLoad = function() {
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

  scene.components["networked-scene"].connect();
};

window.onConnect = function() {
  document.getElementById("loader").style.display = "none";
};
