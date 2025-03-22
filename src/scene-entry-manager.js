import qsTruthy from "./utils/qs_truthy";
import nextTick from "./utils/next-tick";
import { hackyMobileSafariTest } from "./utils/detect-touchscreen";
import { SignInMessages } from "./react-components/auth/SignInModal";
import { createNetworkedEntity } from "./utils/create-networked-entity";

const isBotMode = qsTruthy("bot");
const isMobile = AFRAME.utils.device.isMobile();
const forceEnableTouchscreen = hackyMobileSafariTest();
const isThisMobileVR = AFRAME.utils.device.isMobileVR();
const isDebug = qsTruthy("debug");
const qs = new URLSearchParams(location.search);

import { addMedia } from "./utils/media-utils";
import {
  isIn2DInterstitial,
  handleExitTo2DInterstitial,
  exit2DInterstitialAndEnterVR,
  forceExitFrom2DInterstitial
} from "./utils/vr-interstitial";
import { ObjectContentOrigins } from "./object-types";
import { getAvatarSrc, getAvatarType } from "./utils/avatar-utils";
import { SOUND_ENTER_SCENE } from "./systems/sound-effects-system";
import { MediaDevices, MediaDevicesEvents } from "./utils/media-devices-utils";
import { addComponent, removeEntity } from "bitecs";
import { MyCameraTool } from "./bit-components";
import { anyEntityWith, shouldUseNewLoader } from "./utils/bit-utils";
import { moveToSpawnPoint } from "./bit-systems/waypoint";
import { spawnFromFileList, spawnFromUrl } from "./load-media-on-paste-or-drop";
import { isLockedDownDemoRoom } from "./utils/hub-utils";

export default class SceneEntryManager {
  constructor(hubChannel, authChannel, history) {
    this.hubChannel = hubChannel;
    this.authChannel = authChannel;
    this.store = window.APP.store;
    this.mediaSearchStore = window.APP.mediaSearchStore;
    this.scene = document.querySelector("a-scene");
    this.rightCursorController = document.getElementById("right-cursor-controller");
    this.leftCursorController = document.getElementById("left-cursor-controller");
    this.avatarRig = document.getElementById("avatar-rig");
    this._entered = false;
    /**
     * @type {Function}
     */
    this.performConditionalSignIn = () => {};
    this.history = history;
  }

  init = () => {
    this.whenSceneLoaded(() => {
      console.log("Scene is loaded so setting up controllers");
      this.rightCursorController.components["cursor-controller"].enabled = false;
      this.leftCursorController.components["cursor-controller"].enabled = false;
      this.mediaDevicesManager = APP.mediaDevicesManager;
      this._setupBlocking();
    });
  };

  hasEntered = () => {
    return this._entered;
  };

  enterScene = async (enterInVR, muteOnEntry) => {
    console.log("Entering scene...");
    document.getElementById("viewing-camera").removeAttribute("scene-preview-camera");

    if (isDebug && NAF.connection.adapter.session) {
      NAF.connection.adapter.session.options.verbose = true;
    }

    if (enterInVR) {
      // This specific scene state var is used to check if the user went through the
      // entry flow and chose VR entry, and is used to preempt VR mode on refreshes.
      this.scene.addState("vr-entered");

      // HACK - A-Frame calls getVRDisplays at module load, we want to do it here to
      // force gamepads to become live.
      "getVRDisplays" in navigator && navigator.getVRDisplays();

      await exit2DInterstitialAndEnterVR(true);
    }

    if (shouldUseNewLoader()) {
      moveToSpawnPoint(APP.world, this.scene.systems["hubs-systems"].characterController);
    } else {
      const waypointSystem = this.scene.systems["hubs-systems"].waypointSystem;
      waypointSystem.moveToSpawnPoint();
    }

    if (isMobile || forceEnableTouchscreen || qsTruthy("force_enable_touchscreen")) {
      this.avatarRig.setAttribute("virtual-gamepad-controls", {});
    }

    this._setupPlayerRig();
    this._setupKicking();
    this._setupMedia();
    this._setupCamera();

    if (qsTruthy("offline")) return;

    this._spawnAvatar();

    this.scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_ENTER_SCENE);

    if (isBotMode) {
      this._runBot();
      this.scene.addState("entered");
      this.hubChannel.sendEnteredEvent();
      return;
    }

    this.scene.classList.remove("hand-cursor");
    this.scene.classList.add("no-cursor");

    this.rightCursorController.components["cursor-controller"].enabled = true;
    this.leftCursorController.components["cursor-controller"].enabled = true;
    this._entered = true;

    // Delay sending entry event telemetry until VR display is presenting.
    (async () => {
      while (enterInVR && !this.scene.renderer.xr.isPresenting) {
        await nextTick();
      }

      this.hubChannel.sendEnteredEvent().then(() => {
        this.store.update({ activity: { lastEnteredAt: new Date().toISOString() } });
      });
    })();

    // Bump stored entry count after 30s
    setTimeout(() => this.store.bumpEntryCount(), 30000);

    this.scene.addState("entered");

    APP.mediaDevicesManager.micEnabled = !muteOnEntry;
  };

  whenSceneLoaded = callback => {
    if (this.scene.hasLoaded) {
      console.log("Scene already loaded so callback invoked directly");
      callback();
    } else {
      console.log("Scene not yet loaded so callback is deferred");
      this.scene.addEventListener("loaded", callback);
    }
  };

  enterSceneWhenLoaded = (enterInVR, muteOnEntry) => {
    this.whenSceneLoaded(() => this.enterScene(enterInVR, muteOnEntry));
  };

  exitScene = () => {
    this.scene.exitVR();
    if (APP.dialog && APP.dialog.localMediaStream) {
      APP.dialog.localMediaStream.getTracks().forEach(t => t.stop());
    }
    if (this.hubChannel) {
      this.hubChannel.disconnect();
    }
    if (this.scene.renderer) {
      this.scene.renderer.setAnimationLoop(null); // Stop animation loop, TODO A-Frame should do this
    }
    this.scene.parentNode.removeChild(this.scene);
  };

  _setupPlayerRig = () => {
    // Explict user action changed avatar or updated existing avatar.
    this.scene.addEventListener("avatar_updated", () => this._setPlayerInfoFromProfile(true));

    // Store updates can occur to avatar id in cases like error, auth reset, etc.
    if (!isLockedDownDemoRoom()) {
      this._setPlayerInfoFromProfile();
      this.store.addEventListener("statechanged", () => this._setPlayerInfoFromProfile());
    }

    const avatarScale = parseInt(qs.get("avatar_scale"), 10);
    if (avatarScale) {
      this.avatarRig.setAttribute("scale", { x: avatarScale, y: avatarScale, z: avatarScale });
    }
  };

  _setPlayerInfoFromProfile = async (force = false) => {
    const avatarId = this.store.state.profile.avatarId;
    if (!force && this._lastFetchedAvatarId === avatarId) return; // Avoid continually refetching based upon state changing

    this._lastFetchedAvatarId = avatarId;
    const avatarSrc = await getAvatarSrc(avatarId);

    this.avatarRig.setAttribute("player-info", { avatarSrc, avatarType: getAvatarType(avatarId) });
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
          window.APP.pinningHelper.unpinElement(entity);
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
      NAF.connection.entities.completeSync(ev.detail.clientId, true);
    });
  };

  _setupMedia = () => {
    // HACK we only care about the return value in 1 spot, don't want to deal with that in the newLoader path
    const spawnMediaInfrontOfPlayerAndReturn = (src, contentOrigin) => {
      if (!this.hubChannel.can("spawn_and_move_media")) return;
      const offset = { x: 0, y: 0, z: -1.5 };
      const { entity, orientation } = addMedia(
        src,
        "#interactable-media",
        contentOrigin,
        null,
        !(src instanceof MediaStream),
        true
      );
      orientation.then(or => {
        entity.setAttribute("offset-relative-to", {
          target: "#avatar-pov-node",
          offset,
          orientation: or
        });
      });

      return entity;
    };

    const spawnMediaInfrontOfPlayer = (src, contentOrigin) => {
      if (shouldUseNewLoader()) {
        console.warn(
          "Spawning newLoader object using `spawnMediaInFrontOfPlayer`. This codepath should likely be made more direct.",
          src,
          contentOrigin
        );
        if (typeof src === "string") {
          spawnFromUrl(src);
        } else {
          spawnFromFileList([src]);
        }
      } else {
        spawnMediaInfrontOfPlayerAndReturn(src, contentOrigin);
      }
    };

    this.scene.addEventListener("add_media", e => {
      const contentOrigin = e.detail instanceof File ? ObjectContentOrigins.FILE : ObjectContentOrigins.URL;

      spawnMediaInfrontOfPlayer(e.detail, contentOrigin);
    });

    this.scene.addEventListener("object_spawned", e => {
      this.hubChannel.sendObjectSpawnedEvent(e.detail.objectType);
    });

    this.scene.addEventListener("action_spawn", () => {
      handleExitTo2DInterstitial(false, () => window.APP.mediaSearchStore.pushExitMediaBrowserHistory());
      window.APP.mediaSearchStore.sourceNavigateToDefaultSource();
    });

    this.scene.addEventListener("action_kick_client", ({ detail: { clientId } }) => {
      this.performConditionalSignIn(
        () => this.hubChannel.can("kick_users"),
        async () => await window.APP.hubChannel.kick(clientId),
        SignInMessages.kickUser
      );
    });

    this.scene.addEventListener("action_mute_client", ({ detail: { clientId } }) => {
      this.performConditionalSignIn(
        () => this.hubChannel.can("mute_users"),
        () => window.APP.hubChannel.mute(clientId),
        SignInMessages.muteUser
      );
    });

    this.scene.addEventListener("action_vr_notice_closed", () => forceExitFrom2DInterstitial());

    {
      document.addEventListener("paste", e => {
        if (shouldUseNewLoader()) return;
        if (
          (e.target.matches("input, textarea") || e.target.contentEditable === "true") &&
          document.activeElement === e.target
        )
          return;

        // Never paste into scene if dialog is open
        const uiRoot = document.querySelector(".ui-root");
        if (uiRoot && uiRoot.classList.contains("in-modal-or-overlay")) return;

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

      let lastDebugScene;
      document.addEventListener("drop", e => {
        if (shouldUseNewLoader()) return;
        e.preventDefault();

        if (qsTruthy("debugLocalScene")) {
          URL.revokeObjectURL(lastDebugScene);
          const url = URL.createObjectURL(e.dataTransfer.files[0]);
          this.hubChannel.updateScene(url);
          lastDebugScene = url;
          return;
        }

        let url = e.dataTransfer.getData("url");

        if (!url) {
          // Sometimes dataTransfer text contains a valid URL, so try for that.
          try {
            url = new URL(e.dataTransfer.getData("text")).href;
          } catch (e) {
            // Nope, not this time.
          }
        }

        const files = e.dataTransfer.files;

        if (url) {
          spawnMediaInfrontOfPlayer(url, ObjectContentOrigins.URL);
        } else {
          for (const file of files) {
            spawnMediaInfrontOfPlayer(file, ObjectContentOrigins.FILE);
          }
        }
      });
    }

    document.addEventListener("dragover", e => e.preventDefault());

    let currentVideoShareEntity;
    let isHandlingVideoShare = false;

    const shareSuccess = (isDisplayMedia, isVideoTrackAdded, target) => {
      isHandlingVideoShare = false;

      if (isVideoTrackAdded) {
        if (target === "avatar") {
          this.avatarRig.setAttribute("player-info", { isSharingAvatarCamera: true });
        } else {
          currentVideoShareEntity = spawnMediaInfrontOfPlayerAndReturn(this.mediaDevicesManager.mediaStream, undefined);
          // Wire up custom removal event which will stop the stream.
          if (currentVideoShareEntity) {
            currentVideoShareEntity.setAttribute(
              "emit-scene-event-on-remove",
              `event:${MediaDevicesEvents.VIDEO_SHARE_ENDED}`
            );
          }
        }

        this.scene.emit("share_video_enabled", { source: isDisplayMedia ? MediaDevices.SCREEN : MediaDevices.CAMERA });
        this.scene.addState("sharing_video");
      }
    };

    const shareError = error => {
      console.error(error);
      isHandlingVideoShare = false;
      this.scene.emit("share_video_failed");
    };

    this.scene.addEventListener("action_share_camera", event => {
      if (isHandlingVideoShare) return;
      isHandlingVideoShare = true;
      this.mediaDevicesManager.startVideoShare({
        isDisplayMedia: false,
        target: event.detail?.target,
        success: shareSuccess,
        error: shareError
      });
    });

    this.scene.addEventListener("action_share_screen", () => {
      if (isHandlingVideoShare) return;
      isHandlingVideoShare = true;
      this.mediaDevicesManager.startVideoShare({
        isDisplayMedia: true,
        target: null,
        success: shareSuccess,
        error: shareError
      });
    });

    this.scene.addEventListener(MediaDevicesEvents.VIDEO_SHARE_ENDED, async () => {
      if (isHandlingVideoShare) return;
      isHandlingVideoShare = true;

      if (currentVideoShareEntity && currentVideoShareEntity.parentNode) {
        NAF.utils.takeOwnership(currentVideoShareEntity);
        currentVideoShareEntity.parentNode.removeChild(currentVideoShareEntity);
      }

      await this.mediaDevicesManager.stopVideoShare();
      currentVideoShareEntity = null;

      this.avatarRig.setAttribute("player-info", { isSharingAvatarCamera: false });
      this.scene.emit("share_video_disabled");
      this.scene.removeState("sharing_video");
      isHandlingVideoShare = false;
    });

    this.scene.addEventListener(MediaDevicesEvents.MIC_SHARE_ENDED, async () => {
      await this.mediaDevicesManager.stopMicShare();
    });

    this.scene.addEventListener("action_selected_media_result_entry", async e => {
      // TODO spawn in space when no rights
      const { entry, selectAction } = e.detail;
      if (selectAction !== "spawn") return;

      const delaySpawn = isIn2DInterstitial() && !isThisMobileVR;
      await exit2DInterstitialAndEnterVR();

      // If user has HMD lifted up or gone through interstitial, delay spawning for now. eventually show a modal
      if (delaySpawn) {
        setTimeout(() => {
          spawnMediaInfrontOfPlayer(entry.url, ObjectContentOrigins.URL);
        }, 3000);
      } else {
        spawnMediaInfrontOfPlayer(entry.url, ObjectContentOrigins.URL);
      }
    });

    this.mediaSearchStore.addEventListener("media-exit", () => {
      exit2DInterstitialAndEnterVR();
    });
  };

  _setupCamera = () => {
    this.scene.addEventListener("action_toggle_camera", () => {
      const myCam = anyEntityWith(APP.world, MyCameraTool);
      if (myCam) {
        removeEntity(APP.world, myCam);
        this.scene.removeState("camera");
      } else {
        const avatarPov = document.querySelector("#avatar-pov-node").object3D;
        const eid = createNetworkedEntity(APP.world, "camera");
        addComponent(APP.world, MyCameraTool, eid);

        const obj = APP.world.eid2obj.get(eid);
        obj.position.copy(avatarPov.localToWorld(new THREE.Vector3(0, 0, -1.5)));
        obj.lookAt(avatarPov.getWorldPosition(new THREE.Vector3()));

        this.scene.addState("camera");
      }
    });
  };

  _spawnAvatar = () => {
    this.avatarRig.setAttribute("networked", "template: #remote-avatar; attachTemplateToLocal: false;");
    this.avatarRig.setAttribute("networked-avatar", "");
    this.avatarRig.emit("entered");
  };

  _runBot = async () => {
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
      audioEl.muted = false;
      audioEl.crossorigin = "anonymous";
      audioEl.src = URL.createObjectURL(audioInput.files[0]);
      document.body.appendChild(audioEl);
    };

    if (audioInput.files && audioInput.files.length > 0) {
      getAudio();
    } else {
      audioInput.onchange = getAudio;
    }

    const camera = document.querySelector("#avatar-pov-node");
    const leftController = document.querySelector("#player-left-controller");
    const rightController = document.querySelector("#player-right-controller");
    const getRecording = () => {
      fetch(URL.createObjectURL(dataInput.files[0]))
        .then(resp => resp.json())
        .then(recording => {
          camera.setAttribute("replay", "");
          camera.components["replay"].poses = recording.camera.poses;

          leftController.setAttribute("replay", "");
          leftController.components["replay"].poses = recording.left.poses;
          leftController.removeAttribute("visibility-by-path");
          leftController.removeAttribute("track-pose");
          leftController.setAttribute("visible", true);

          rightController.setAttribute("replay", "");
          rightController.components["replay"].poses = recording.right.poses;
          rightController.removeAttribute("visibility-by-path");
          rightController.removeAttribute("track-pose");
          rightController.setAttribute("visible", true);
        });
    };

    if (dataInput.files && dataInput.files.length > 0) {
      getRecording();
    } else {
      dataInput.onchange = getRecording;
    }

    await new Promise(resolve => audioEl.addEventListener("canplay", resolve));

    const audioStream = audioEl.captureStream
      ? audioEl.captureStream()
      : audioEl.mozCaptureStream
      ? audioEl.mozCaptureStream()
      : null;

    if (audioStream) {
      let audioVolume = Number(qs.get("audio_volume") || "1.0");
      if (isNaN(audioVolume)) {
        audioVolume = 1.0;
      }
      const audioContext = THREE.AudioContext.getContext();
      const audioSource = audioContext.createMediaStreamSource(audioStream);
      const audioDestination = audioContext.createMediaStreamDestination();
      const gainNode = audioContext.createGain();
      audioSource.connect(gainNode);
      gainNode.connect(audioDestination);
      gainNode.gain.value = audioVolume;

      const audioSystem = AFRAME.scenes[0].systems["hubs-systems"].audioSystem;
      audioSystem.addStreamToOutboundAudio("microphone", audioDestination.stream);
    }

    const connect = async () => {
      await APP.dialog.setLocalMediaStream(this.mediaDevicesManager.mediaStream);
      audioEl.play();
    };
    if (APP.dialog._sendTransport) {
      connect();
    } else {
      this.scene.addEventListener("didConnectToDialog", connect);
    }
  };
}
