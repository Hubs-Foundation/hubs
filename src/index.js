import "networked-aframe";
import "aframe-teleport-controls";

import "./components/axis-dpad";
import "./components/snap-rotation";
import "./components/mute-mic";
import "./components/audio-feedback";
import "./components/nametag-transform";

import { generateName } from "./utils";

NAF.schemas.add({
  template: "#nametag-template",
  components: [
    {
      selector: ".nametag",
      component: "text",
      property: "value"
    }
  ]
});

window.onSceneLoad = function() {
  var username = generateName();
  do {
    username = prompt("Choose a username", username);
  } while (!(username && username.length));

  var player = document.getElementById("player-rig");
  var myNametag = player.querySelector(".nametag");
  myNametag.setAttribute("text", "value", username);

  document.querySelector("a-scene").components["networked-scene"].connect();
};


