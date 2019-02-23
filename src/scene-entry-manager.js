import qsTruthy from "./utils/qs_truthy";
import screenfull from "screenfull";
import nextTick from "./utils/next-tick";
import pinnedEntityToGltf from "./utils/pinned-entity-to-gltf";

const playerHeight = 1.6;
const isBotMode = qsTruthy("bot");
const isMobile = AFRAME.utils.device.isMobile();
const isDebug = qsTruthy("debug");
const qs = new URLSearchParams(location.search);
const aframeInspectorUrl = require("file-loader?name=assets/js/[name]-[hash].[ext]!aframe-inspector/dist/aframe-inspector.min.js");

import { addMedia, proxiedUrlFor, getPromotionTokenForFile } from "./utils/media-utils";
import { ObjectContentOrigins } from "./object-types";

function requestFullscreen() {
  if (screenfull.enabled && !screenfull.isFullscreen) screenfull.request();
}

export default class SceneEntryManager {
  constructor(hubChannel, authChannel) {
    this.hubChannel = hubChannel;
    this.authChannel = authChannel;
    this.store = window.APP.store;
    this.scene = document.querySelector("a-scene");
    this.cursorController = document.querySelector("#cursor-controller");
    this.playerRig = document.querySelector("#player-rig");
    this._entered = false;
    this.onRequestAuthentication = () => {};
  }

  init = () => {
    this.whenSceneLoaded(() => {
      this.cursorController.components["cursor-controller"].enabled = false;
    });
  };

  hasEntered = () => {
    return this._entered;
  };

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

    let isCardboard = false;

    if (enterInVR) {
      // HACK - A-Frame calls getVRDisplays at module load, we want to do it here to
      // force gamepads to become live.
      navigator.getVRDisplays();

      isCardboard =
        AFRAME.utils.device
          .getVRDisplay()
          .displayName.toLowerCase()
          .indexOf("cardboard") >= 0;

      this.scene.enterVR();
    } else if (AFRAME.utils.device.isMobile() && !AFRAME.utils.device.isIOS()) {
      document.body.addEventListener("touchend", () => {
        if (!document.activeElement && !["INPUT", "TEXTAREA"].includes(document.activeElement.nodeName)) {
          requestFullscreen();
        }
      });
    }

    if (!isCardboard) {
      this.playerRig.removeAttribute("cardboard-controls");
    }

    if (isMobile || qsTruthy("mobile")) {
      this.playerRig.setAttribute("virtual-gamepad-controls", {});
    }

    this._setupPlayerRig();
    this._setupBlocking();
    this._setupKicking();
    this._setupMedia(mediaStream);
    this._setupCamera();

    if (qsTruthy("offline")) return;

    this._spawnAvatar();

    if (isBotMode) {
      this._runBot(mediaStream);
      return;
    }

    this.scene.setAttribute("motion-capture-replayer", "enabled", false);
    this.scene.systems["motion-capture-replayer"].remove();

    if (mediaStream) {
      NAF.connection.adapter.setLocalMediaStream(mediaStream);
    }

    this.scene.classList.remove("hand-cursor");
    this.scene.classList.add("no-cursor");

    this.cursorController.components["cursor-controller"].enabled = true;
    this._entered = true;

    // Delay sending entry event telemetry until VR display is presenting.
    (async () => {
      while (enterInVR && !(await navigator.getVRDisplays()).find(d => d.isPresenting)) {
        await nextTick();
      }

      this.hubChannel.sendEntryEvent().then(() => {
        this.store.update({ activity: { lastEnteredAt: new Date().toISOString() } });
      });
    })();

    this.scene.addState("entered");
  };

  whenSceneLoaded = callback => {
    if (this.scene.hasLoaded) {
      callback();
    } else {
      this.scene.addEventListener("loaded", callback);
    }
  };

  enterSceneWhenLoaded = (mediaStream, enterInVR) => {
    this.whenSceneLoaded(() => this.enterScene(mediaStream, enterInVR));
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
    const { avatarId, displayName } = this.store.state.profile;
    this.playerRig.setAttribute("player-info", {
      displayName,
      avatarSrc: avatarId && avatarId.startsWith("http") ? proxiedUrlFor(avatarId) : `#${avatarId || "botdefault"}`
    });
    const hudController = this.playerRig.querySelector("[hud-controller]");
    hudController.setAttribute("hud-controller", { showTip: !this.store.state.activity.hasFoundFreeze });
    this.scene.emit("username-changed", { username: displayName });
  };

  _setupKicking = () => {
    // This event is only received by the kicker
    document.body.addEventListener("kicked", ({ detail }) => {
      const { clientId: kickedClientId } = detail;
      const { entities } = NAF.connection.entities;
      for (const id in entities) {
        const entity = entities[id];
        if (NAF.utils.getCreator(entity) !== kickedClientId) continue;

        if (entity.components.networked.data.persistent) {
          NAF.utils.takeOwnership(entity);
          this._unpinElement(entity);
          entity.parentNode.removeChild(entity);
        } else {
          NAF.entities.removeEntity(id);
        }
      }
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

  _pinElement = async el => {
    const { networkId } = el.components.networked.data;

    const { fileId, src } = el.components["media-loader"].data;

    let fileAccessToken, promotionToken;
    if (fileId) {
      fileAccessToken = new URL(src).searchParams.get("token");
      const storedPromotionToken = getPromotionTokenForFile(fileId);
      if (storedPromotionToken) {
        promotionToken = storedPromotionToken.promotionToken;
      }
    }

    const gltfNode = pinnedEntityToGltf(el);
    if (!gltfNode) return;
    el.setAttribute("networked", { persistent: true });
    el.setAttribute("media-loader", { fileIsOwned: true });

    try {
      await this.hubChannel.pin(networkId, gltfNode, fileId, fileAccessToken, promotionToken);
    } catch (e) {
      if (e.reason === "invalid_token") {
        await this.authChannel.signOut(this.hubChannel);
        this._signInAndPinElement(el);
      } else {
        console.warn("Pin failed for unknown reason", e);
      }
    }
  };

  _signInAndPinElement = el => {
    if (this.hubChannel.signedIn) {
      this._pinElement(el);
    } else {
      const wasInVR = this.scene.is("vr-mode");
      if (wasInVR) this.scene.exitVR();
      const continueTextId = wasInVR ? "entry.return-to-vr" : "dialog.close";

      this.onRequestAuthentication("sign-in.pin", "sign-in.pin-complete", continueTextId, async () => {
        let pinningFailed = false;
        if (this.hubChannel.signedIn) {
          try {
            await this._pinElement(el);
          } catch (e) {
            pinningFailed = true;
          }
        } else {
          pinningFailed = true;
        }

        if (pinningFailed) {
          // UI pins the entity optimistically, so we undo that here.
          el.setAttribute("pinnable", "pinned", false);
        }

        if (wasInVR) this.scene.enterVR();
      });
    }
  };

  _unpinElement = el => {
    const components = el.components;
    const networked = components.networked;

    if (!networked || !networked.data || !NAF.utils.isMine(el)) return;

    const networkId = components.networked.data.networkId;
    el.setAttribute("networked", { persistent: false });

    const mediaLoader = components["media-loader"];
    const fileId = mediaLoader.data && mediaLoader.data.fileId;

    this.hubChannel.unpin(networkId, fileId);
  };

  _setupMedia = mediaStream => {
    const offset = { x: 0, y: 0, z: -1.5 };
    const spawnMediaInfrontOfPlayer = (src, contentOrigin) => {
      const { entity, orientation } = addMedia(
        src,
        "#interactable-media",
        contentOrigin,
        !(src instanceof MediaStream),
        true
      );

      orientation.then(or => {
        entity.setAttribute("offset-relative-to", {
          target: "#player-camera",
          offset,
          orientation: or
        });
      });

      return entity;
    };

    this.scene.addEventListener("add_media", e => {
      const contentOrigin = e.detail instanceof File ? ObjectContentOrigins.FILE : ObjectContentOrigins.URL;

      spawnMediaInfrontOfPlayer(e.detail, contentOrigin);
    });

    this.scene.addEventListener("pinned", e => {
      this._signInAndPinElement(e.detail.el);
    });

    this.scene.addEventListener("unpinned", e => {
      this._unpinElement(e.detail.el);
    });

    this.scene.addEventListener("object_spawned", e => {
      this.hubChannel.sendObjectSpawnedEvent(e.detail.objectType);
    });

    document.addEventListener("paste", e => {
      if (e.target.matches("input, textarea") && document.activeElement === e.target) return;

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

    let currentVideoShareEntity;
    let isHandlingVideoShare = false;

    const shareVideoMediaStream = async constraints => {
      if (isHandlingVideoShare) return;
      isHandlingVideoShare = true;

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoTracks = newStream ? newStream.getVideoTracks() : [];

      if (videoTracks.length > 0) {
        newStream.getVideoTracks().forEach(track => mediaStream.addTrack(track));
        NAF.connection.adapter.setLocalMediaStream(mediaStream);
        currentVideoShareEntity = spawnMediaInfrontOfPlayer(mediaStream, undefined);

        // Wire up custom removal event which will stop the stream.
        currentVideoShareEntity.setAttribute("emit-scene-event-on-remove", "event:action_end_video_sharing");
      }

      this.scene.emit("share_video_enabled", { source: constraints.video.mediaSource });
      isHandlingVideoShare = false;
    };

    this.scene.addEventListener("action_share_camera", () => {
      shareVideoMediaStream({
        video: {
          mediaSource: "camera",
          width: 720,
          frameRate: 30
        }
      });
    });

    this.scene.addEventListener("action_share_window", () => {
      shareVideoMediaStream({
        video: {
          mediaSource: "window",
          // Work around BMO 1449832 by calculating the width. This will break for multi monitors if you share anything
          // other than your current monitor that has a different aspect ratio.
          width: 720 * (screen.width / screen.height),
          height: 720,
          frameRate: 30
        }
      });
    });

    this.scene.addEventListener("action_share_screen", () => {
      shareVideoMediaStream({
        video: {
          mediaSource: "screen",
          // Work around BMO 1449832 by calculating the width. This will break for multi monitors if you share anything
          // other than your current monitor that has a different aspect ratio.
          width: 720 * (screen.width / screen.height),
          height: 720,
          frameRate: 30
        }
      });
    });

    this.scene.addEventListener("action_end_video_sharing", () => {
      if (isHandlingVideoShare) return;
      isHandlingVideoShare = true;

      if (currentVideoShareEntity && currentVideoShareEntity.parentNode) {
        currentVideoShareEntity.parentNode.removeChild(currentVideoShareEntity);
      }

      for (const track of mediaStream.getVideoTracks()) {
        mediaStream.removeTrack(track);
      }

      NAF.connection.adapter.setLocalMediaStream(mediaStream);
      currentVideoShareEntity = null;

      this.scene.emit("share_video_disabled");
      isHandlingVideoShare = false;
    });

    this.scene.addEventListener("action_selected_media_result_entry", e => {
      // TODO spawn in space when no rights
      const entry = e.detail;
      if (entry.type === "scene_listing") return;

      spawnMediaInfrontOfPlayer(entry.url, ObjectContentOrigins.URL);
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

    this.scene.addEventListener("photo_taken", e => {
      this.hubChannel.sendMessage({ src: e.detail }, "spawn");
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
    let audioInput;
    let dataInput;

    // Wait for startup to render form
    do {
      audioInput = document.querySelector("#bot-audio-input");
      dataInput = document.querySelector("#bot-data-input");
      await nextTick();
    } while (!audioInput || !dataInput);

    const getAudio = () => {
      audioEl.loop = true;
      audioEl.muted = true;
      audioEl.crossorigin = "anonymous";
      audioEl.src = URL.createObjectURL(audioInput.files[0]);
      document.body.appendChild(audioEl);
    };

    if (audioInput.files && audioInput.files.length > 0) {
      getAudio();
    } else {
      audioInput.onchange = getAudio;
    }

    const getRecording = () => {
      const url = URL.createObjectURL(dataInput.files[0]);
      this.playerRig.setAttribute("avatar-replay", { recordingUrl: url });
    };

    if (dataInput.files && dataInput.files.length > 0) {
      getRecording();
    } else {
      dataInput.onchange = getRecording;
    }

    await new Promise(resolve => audioEl.addEventListener("canplay", resolve));
    mediaStream.addTrack(
      audioEl.captureStream
        ? audioEl.captureStream().getAudioTracks()[0]
        : audioEl.mozCaptureStream
          ? audioEl.mozCaptureStream().getAudioTracks()[0]
          : null
    );
    NAF.connection.adapter.setLocalMediaStream(mediaStream);
    audioEl.play();
  };
}
