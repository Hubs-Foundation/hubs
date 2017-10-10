require("networked-aframe");
require("aframe-teleport-controls");

// require("./components/rig-selector");
require("./components/axis-dpad");
require("./components/snap-rotation");
require("./components/mute-mic");
require("./components/audio-feedback");
require("./components/billboard");

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


