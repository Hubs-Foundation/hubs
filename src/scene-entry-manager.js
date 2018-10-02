import qsTruthy from "./utils/qs_truthy";
import screenfull from "screenfull";
import { inGameActions } from "./input-mappings";

const playerHeight = 1.6;
const isBotMode = qsTruthy("bot");
const isMobile = AFRAME.utils.device.isMobile();
const isDebug = qsTruthy("debug");
const qs = new URLSearchParams(location.search);
const aframeInspectorUrl = require("file-loader?name=assets/js/[name]-[hash].[ext]!aframe-inspector/dist/aframe-inspector.min.js");

import { addMedia } from "./utils/media-utils";
import { ObjectContentOrigins } from "./object-types";

function requestFullscreen() {
  if (screenfull.enabled && !screenfull.isFullscreen) screenfull.request();
}

export default class SceneEntryManager {
  constructor(hubChannel) {
    this.hubChannel = hubChannel;
    this.store = window.APP.store;
    this.scene = document.querySelector("a-scene");
    this.playerRig = document.querySelector("#player-rig");
  }

  enterScene = async (mediaStream, enterInVR) => {
    const playerCamera = document.querySelector("#player-camera");
    playerCamera.removeAttribute("scene-preview-camera");
    playerCamera.object3D.position.set(0, playerHeight, 0);

    // Get aframe inspector url using the webpack file-loader.
    // Set the aframe-inspector url to our hosted copy.
    this.scene.setAttribute("inspector", { url: aframeInspectorUrl });

    if (isDebug) {
      NAF.connection.adapter.session.options.verbose = true;
    }

    if (enterInVR) {
      this.scene.enterVR();
    } else if (AFRAME.utils.device.isMobile()) {
      document.body.addEventListener("touchend", requestFullscreen);
    }

    AFRAME.registerInputActions(inGameActions, "default");

    if (isMobile || qsTruthy("mobile")) {
      this.playerRig.setAttribute("virtual-gamepad-controls", {});
    }

    this._setupPlayerRig();
    this._setupScreensharing(mediaStream);
    this._setupBlocking();
    this._setupMedia();
    this._setupCamera();

    if (qsTruthy("offline")) return;

    if (mediaStream) {
      NAF.connection.adapter.setLocalMediaStream(mediaStream);
    }

    this._spawnAvatar();

    if (isBotMode) {
      this._runBot(mediaStream);
      return;
    }

    this.scene.classList.add("no-cursor");

    this.hubChannel.sendEntryEvent().then(() => {
      this.store.update({ activity: { lastEnteredAt: new Date().toISOString() } });
    });
  };

  enterSceneWhenLoaded = (mediaStream, enterInVR) => {
    const enterSceneImmediately = () => this.enterScene(mediaStream, enterInVR);

    if (this.scene.hasLoaded) {
      enterSceneImmediately();
    } else {
      this.scene.addEventListener("loaded", enterSceneImmediately);
    }
  };

  exitScene = () => {
    if (NAF.connection.adapter && NAF.connection.adapter.localMediaStream) {
      NAF.connection.adapter.localMediaStream.getTracks().forEach(t => t.stop());
    }
    if (this.hubChannel) {
      this.hubChannel.disconnect();
    }
    if (this.scene.renderer) {
      this.scene.renderer.setAnimationLoop(null); // Stop animation loop, TODO A-Frame should do this
    }
    document.body.removeChild(this.scene);
    document.body.removeEventListener("touchend", requestFullscreen);
  };

  _setupPlayerRig = () => {
    this._updatePlayerRigWithProfile();
    this.store.addEventListener("statechanged", this._updatePlayerRigWithProfile);

    const avatarScale = parseInt(qs.get("avatar_scale"), 10);

    if (avatarScale) {
      this.playerRig.setAttribute("scale", { x: avatarScale, y: avatarScale, z: avatarScale });
    }
  };

  _updatePlayerRigWithProfile = () => {
    const displayName = this.store.state.profile.displayName;
    this.playerRig.setAttribute("player-info", {
      displayName,
      avatarSrc: "#" + (this.store.state.profile.avatarId || "botdefault")
    });
    const hudController = this.playerRig.querySelector("[hud-controller]");
    hudController.setAttribute("hud-controller", { showTip: !this.store.state.activity.hasFoundFreeze });
    this.scene.emit("username-changed", { username: displayName });
  };

  _setupScreensharing = mediaStream => {
    const videoTracks = mediaStream ? mediaStream.getVideoTracks() : [];
    let sharingScreen = videoTracks.length > 0;

    const screenEntityId = `${NAF.clientId}-screen`;
    let screenEntity = document.getElementById(screenEntityId);

    if (screenEntity) {
      screenEntity.setAttribute("visible", sharingScreen);
    } else if (sharingScreen) {
      screenEntity = document.createElement("a-entity");
      screenEntity.id = screenEntityId;
      screenEntity.setAttribute("offset-relative-to", {
        target: "#player-camera",
        offset: "0 0 -2",
        on: "action_share_screen"
      });
      screenEntity.setAttribute("networked", { template: "#video-template" });
      this.scene.appendChild(screenEntity);
    }

    this.scene.addEventListener("action_share_screen", () => {
      sharingScreen = !sharingScreen;
      if (sharingScreen) {
        for (const track of videoTracks) {
          mediaStream.addTrack(track);
        }
      } else {
        for (const track of mediaStream.getVideoTracks()) {
          mediaStream.removeTrack(track);
        }
      }
      NAF.connection.adapter.setLocalMediaStream(mediaStream);
      screenEntity.setAttribute("visible", sharingScreen);
    });
  };

  _setupBlocking = () => {
    document.body.addEventListener("blocked", ev => {
      NAF.connection.entities.removeEntitiesOfClient(ev.detail.clientId);
    });

    document.body.addEventListener("unblocked", ev => {
      NAF.connection.entities.completeSync(ev.detail.clientId);
    });
  };

  _setupMedia = () => {
    const offset = { x: 0, y: 0, z: -1.5 };
    const spawnMediaInfrontOfPlayer = (src, contentOrigin) => {
      const { entity, orientation } = addMedia(src, "#interactable-media", contentOrigin, true);

      orientation.then(or => {
        entity.setAttribute("offset-relative-to", {
          target: "#player-camera",
          offset,
          orientation: or
        });
      });
    };

    this.scene.addEventListener("add_media", e => {
      const contentOrigin = e.detail instanceof File ? ObjectContentOrigins.FILE : ObjectContentOrigins.URL;

      spawnMediaInfrontOfPlayer(e.detail, contentOrigin);
    });

    this.scene.addEventListener("object_spawned", e => {
      this.hubChannel.sendObjectSpawnedEvent(e.detail.objectType);
    });

    document.addEventListener("paste", e => {
      if (e.target.nodeName === "INPUT") return;

      const url = e.clipboardData.getData("text");
      const files = e.clipboardData.files && e.clipboardData.files;
      if (url) {
        spawnMediaInfrontOfPlayer(url, ObjectContentOrigins.URL);
      } else {
        for (const file of files) {
          spawnMediaInfrontOfPlayer(file, ObjectContentOrigins.CLIPBOARD);
        }
      }
    });

    document.addEventListener("dragover", e => e.preventDefault());

    document.addEventListener("drop", e => {
      e.preventDefault();
      const url = e.dataTransfer.getData("url");
      const files = e.dataTransfer.files;
      if (url) {
        spawnMediaInfrontOfPlayer(url, ObjectContentOrigins.URL);
      } else {
        for (const file of files) {
          spawnMediaInfrontOfPlayer(file, ObjectContentOrigins.FILE);
        }
      }
    });
  };

  _setupCamera = () => {
    this.scene.addEventListener("action_spawn_camera", () => {
      const entity = document.createElement("a-entity");
      entity.setAttribute("networked", { template: "#interactable-camera" });
      entity.setAttribute("offset-relative-to", {
        target: "#player-camera",
        offset: { x: 0, y: 0, z: -1.5 }
      });
      this.scene.appendChild(entity);
    });
  };

  _spawnAvatar = () => {
    this.playerRig.setAttribute("networked", "template: #remote-avatar-template; attachTemplateToLocal: false;");
    this.playerRig.setAttribute("networked-avatar", "");
    this.playerRig.emit("entered");
  };

  _runBot = async mediaStream => {
    this.playerRig.setAttribute("avatar-replay", {
      camera: "#player-camera",
      leftController: "#player-left-controller",
      rightController: "#player-right-controller"
    });

    const audioEl = document.createElement("audio");
    const audioInput = document.querySelector("#bot-audio-input");
    audioInput.onchange = () => {
      audioEl.loop = true;
      audioEl.muted = true;
      audioEl.crossorigin = "anonymous";
      audioEl.src = URL.createObjectURL(audioInput.files[0]);
      document.body.appendChild(audioEl);
    };
    const dataInput = document.querySelector("#bot-data-input");
    dataInput.onchange = () => {
      const url = URL.createObjectURL(dataInput.files[0]);
      this.playerRig.setAttribute("avatar-replay", { recordingUrl: url });
    };
    await new Promise(resolve => audioEl.addEventListener("canplay", resolve));
    mediaStream.addTrack(audioEl.captureStream().getAudioTracks()[0]);
    audioEl.play();
  };
}
