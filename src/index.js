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
import { promptForName } from "./utils";
import Config from "./config";

registerNetworkScheams();
registerInputMappings();

const waitForConnected = function() {
  return new Promise(resolve => {
    NAF.clientId
      ? resolve()
      : document.body.addEventListener("connected", resolve);
  });
};
AFRAME.registerComponent("networked-video-player", {
  schema: {},
  init() {
    waitForConnected()
      .then(() => {
        const networkedEl = NAF.utils.getNetworkedEntity(this.el);
        if (!networkedEl) {
          return Promise.reject(
            "Vdeo player must be added on a node, or a child of a node, with the `networked` component."
          );
        }
        const ownerId = networkedEl.components.networked.data.owner;
        console.log("video player for " + ownerId);
        return NAF.connection.adapter.getMediaStream(ownerId);
      })
      .then(stream => {
        console.log("Stream", stream);
        if (!stream) {
          return;
        }

        const v = document.createElement("video");
        v.srcObject = stream;
        v.style.position = "absolute";
        v.style.bottom = 0;
        v.style.height = "100px";
        v.style.background = "black";
        document.body.appendChild(v);
        v.play();

        this.videoEl = v;

        v.onloadedmetadata = () => {
          const ratio = v.videoWidth / v.videoHeight;
          this.el.setAttribute("geometry", {
            width: ratio * 1,
            height: 1
          });
          //this.el.setAttribute("visible", true);
          this.el.setAttribute("material", "src", v);
        };
      });
  },

  remove() {
    if (this.videoEl) {
      this.videoEl.parent.removeChild(this.videoEl);
    }
  }
});

function updateVideoElementPosition(entity) {
  const headEl = document.querySelector("#head");

  const offset = new THREE.Vector3(0, 0, -2);
  headEl.object3D.localToWorld(offset);
  entity.setAttribute("position", offset);

  const headWorldRotation = headEl.object3D.getWorldRotation();
  entity.setAttribute("rotation", {
    x: headWorldRotation.x * THREE.Math.RAD2DEG,
    y: headWorldRotation.y * THREE.Math.RAD2DEG,
    z: headWorldRotation.z * THREE.Math.RAD2DEG
  });
}

function shareScreen() {
  const track = NAF.connection.adapter.localMediaStream.getVideoTracks()[0];

  const id = `${NAF.clientId}-screen`;
  let entity = document.getElementById(id);
  if (!entity) {
    const sceneEl = document.querySelector("a-scene");
    entity = document.createElement("a-entity");
    entity.id = id;
    entity.setAttribute("networked", "template: #video-template");
    sceneEl.appendChild(entity);
  }

  track.enabled = !track.enabled;
  entity.setAttribute("visible", track.enabled);
  if (track.enabled) {
    updateVideoElementPosition(entity);
  }
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
