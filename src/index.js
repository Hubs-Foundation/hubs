import queryString from "query-string";

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
import "./components/hand-controls-visibility";

import "./systems/personal-space-bubble";

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

NAF.schemas.add({
  template: "#hand-template",
  components: ["position", "rotation", "visible"]
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

const promptForName = function() {
  var username = generateName();
  do {
    username = prompt("Choose a username", username);
  } while (!(username && username.length));
  return username;
};

const qs = queryString.parse(location.search);
window.onSceneLoad = function() {
  const scene = document.querySelector("a-scene");

  if (qs.room && !isNaN(parseInt(qs.room))) {
    scene.setAttribute("networked-scene", "room", parseInt(qs.room));
  }

  const username = promptForName(); // promptForName is blocking
  const myNametag = document.querySelector("#player-rig .nametag");
  myNametag.setAttribute("text", "value", username);

  scene.components["networked-scene"].connect();
};
