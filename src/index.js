import "networked-aframe";
import "naf-janus-adapter";
import "aframe-teleport-controls";
import "aframe-input-mapping-component";

import "./components/axis-dpad";
import "./components/snap-rotation";
import "./components/mute-mic";
import "./components/audio-feedback";
import "./components/nametag-transform";
import "./components/avatar-customization";
import "./components/mute-state-indicator";

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

AFRAME.registerInputMappings({
  default: {
    common: {
      // @TODO these dpad events are emmited by an axis-dpad component. This should probalby move into either tracked-controller or input-mapping
      dpadleftdown: "action_snap_rotate_left",
      dpadrightdown: "action_snap_rotate_right",
      dpadcenterdown: "action_teleport_down", // @TODO once once #30 lands in aframe-teleport controls this just maps to "action_teleport_aim"
      dpadcenterup: "action_teleport_up" // @TODO once once #30 lands in aframe-teleport controls this just maps to "action_teleport_teleport"
    },
    "vive-controls": {
      menudown: "action_mute"
    },
    "oculus-touch-controls": {
      xbuttondown: "action_mute"
    },
    daydream: {
      menudown: "action_mute"
    },
    keyboard: {
      m_press: "action_mute",
      q_press: "action_snap_rotate_left",
      e_press: "action_snap_rotate_right"
    }
  }
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


