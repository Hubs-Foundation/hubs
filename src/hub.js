import "./assets/stylesheets/hub.scss";
import queryString from "query-string";

import { patchWebGLRenderingContext } from "./utils/webgl";
patchWebGLRenderingContext();

import "aframe-xr";

import "./vendor/GLTFLoader";
import "networked-aframe/src/index";
import "naf-janus-adapter";
import "aframe-teleport-controls";
import "aframe-input-mapping-component";
import "aframe-billboard-component";
import "aframe-rounded";
import "webrtc-adapter";
import "aframe-slice9-component";
import "aframe-motion-capture-components";
import "./utils/audio-context-fix";

import trackpad_dpad4 from "./behaviours/trackpad-dpad4";
import trackpad_scrolling from "./behaviours/trackpad-scrolling";
import joystick_dpad4 from "./behaviours/joystick-dpad4";
import msft_mr_axis_with_deadzone from "./behaviours/msft-mr-axis-with-deadzone";
import { PressedMove } from "./activators/pressedmove";
import { ReverseY } from "./activators/reversey";
import "./activators/shortpress";

import "./components/wasd-to-analog2d"; //Might be a behaviour or activator in the future
import "./components/mute-mic";
import "./components/audio-feedback";
import "./components/bone-mute-state-indicator";
import "./components/bone-visibility";
import "./components/in-world-hud";
import "./components/virtual-gamepad-controls";
import "./components/ik-controller";
import "./components/hand-controls2";
import "./components/character-controller";
import "./components/haptic-feedback";
import "./components/networked-video-player";
import "./components/offset-relative-to";
import "./components/water";
import "./components/skybox";
import "./components/layers";
import "./components/spawn-controller";
import "./components/hide-when-quality";
import "./components/player-info";
import "./components/debug";
import "./components/animation-mixer";
import "./components/loop-animation";
import "./components/hand-poses";
import "./components/gltf-model-plus";
import "./components/gltf-bundle";
import "./components/hud-controller";
import "./components/freeze-controller";
import "./components/icon-button";
import "./components/text-button";
import "./components/block-button";
import "./components/visible-while-frozen";
import "./components/stats-plus";
import "./components/networked-avatar";
import "./components/css-class";
import "./components/scene-shadow";
import "./components/avatar-replay";
import "./components/image-plus";
import "./components/auto-box-collider";
import "./components/pinch-to-move";
import "./components/look-on-mobile";
import "./components/pitch-yaw-rotator";
import "./components/input-configurator";
import "./components/sticky-object";
import "./components/auto-scale-cannon-physics-body";
import "./components/position-at-box-shape-border";
import "./components/remove-networked-object-button";

import ReactDOM from "react-dom";
import React from "react";
import UIRoot from "./react-components/ui-root";
import HubChannel from "./utils/hub-channel";
import LinkChannel from "./utils/link-channel";
import { connectToReticulum } from "./utils/phoenix-utils";
import { disableiOSZoom } from "./utils/disable-ios-zoom";
import { addMedia } from "./utils/media-utils";

import "./systems/personal-space-bubble";
import "./systems/app-mode";
import "./systems/exit-on-blur";

import "./gltf-component-mappings";
import { DEFAULT_ENVIRONMENT_URL } from "./assets/environments/environments";

import { App } from "./App";

window.APP = new App();
window.APP.RENDER_ORDER = {
  HUD_BACKGROUND: 1,
  HUD_ICONS: 2,
  CURSOR: 3
};
const store = window.APP.store;

const qs = queryString.parse(location.search);
const isMobile = AFRAME.utils.device.isMobile();

if (qs.quality) {
  window.APP.quality = qs.quality;
} else {
  window.APP.quality = isMobile ? "low" : "high";
}

import "aframe-physics-system";
import "aframe-physics-extras";
import "aframe-extras/src/pathfinding";
import "super-hands";
import "./components/super-networked-interactable";
import "./components/networked-counter";
import "./components/super-spawner";
import "./components/event-repeater";
import "./components/controls-shape-offset";
import "./components/duck";
import "./components/quack";

import "./components/cardboard-controls";

import "./components/cursor-controller";

import "./components/nav-mesh-helper";

import registerNetworkSchemas from "./network-schemas";
import { inGameActions, config as inputConfig } from "./input-mappings";
import registerTelemetry from "./telemetry";

import { getAvailableVREntryTypes, VR_DEVICE_AVAILABILITY } from "./utils/vr-caps-detect.js";
import ConcurrentLoadDetector from "./utils/concurrent-load-detector.js";

function qsTruthy(param) {
  const val = qs[param];
  // if the param exists but is not set (e.g. "?foo&bar"), its value is null.
  return val === null || /1|on|true/i.test(val);
}

const isBotMode = qsTruthy("bot");
const isTelemetryDisabled = qsTruthy("disable_telemetry");
const isDebug = qsTruthy("debug");

if (!isBotMode && !isTelemetryDisabled) {
  registerTelemetry();
}

disableiOSZoom();

AFRAME.registerInputBehaviour("trackpad_dpad4", trackpad_dpad4);
AFRAME.registerInputBehaviour("trackpad_scrolling", trackpad_scrolling);
AFRAME.registerInputBehaviour("joystick_dpad4", joystick_dpad4);
AFRAME.registerInputBehaviour("msft_mr_axis_with_deadzone", msft_mr_axis_with_deadzone);
AFRAME.registerInputActivator("pressedmove", PressedMove);
AFRAME.registerInputActivator("reverseY", ReverseY);
AFRAME.registerInputMappings(inputConfig, true);

const concurrentLoadDetector = new ConcurrentLoadDetector();

concurrentLoadDetector.start();

store.init();

function mountUI(scene, props = {}) {
  const disableAutoExitOnConcurrentLoad = qsTruthy("allow_multi");
  const forcedVREntryType = qs.vr_entry_type || null;
  const enableScreenSharing = qsTruthy("enable_screen_sharing");
  const htmlPrefix = document.body.dataset.htmlPrefix || "";
  const showProfileEntry = !store.state.activity.hasChangedName;

  ReactDOM.render(
    <UIRoot
      {...{
        scene,
        concurrentLoadDetector,
        disableAutoExitOnConcurrentLoad,
        forcedVREntryType,
        enableScreenSharing,
        store,
        htmlPrefix,
        showProfileEntry,
        ...props
      }}
    />,
    document.getElementById("ui-root")
  );
}

const onReady = async () => {
  const scene = document.querySelector("a-scene");
  const hubChannel = new HubChannel(store);
  const linkChannel = new LinkChannel(store);

  document.querySelector("canvas").classList.add("blurred");
  window.APP.scene = scene;

  registerNetworkSchemas();

  let uiProps = { linkChannel };

  mountUI(scene);

  const remountUI = props => {
    uiProps = { ...uiProps, ...props };
    mountUI(scene, uiProps);
  };

  const applyProfileFromStore = playerRig => {
    const displayName = store.state.profile.displayName;
    playerRig.setAttribute("player-info", {
      displayName,
      avatarSrc: "#" + (store.state.profile.avatarId || "botdefault")
    });
    const hudController = playerRig.querySelector("[hud-controller]");
    hudController.setAttribute("hud-controller", { showTip: !store.state.activity.hasFoundFreeze });
    document.querySelector("a-scene").emit("username-changed", { username: displayName });
  };

  const exitScene = () => {
    if (NAF.connection.adapter && NAF.connection.adapter.localMediaStream) {
      NAF.connection.adapter.localMediaStream.getTracks().forEach(t => t.stop());
    }
    if (hubChannel) {
      hubChannel.disconnect();
    }
    const scene = document.querySelector("a-scene");
    if (scene) {
      if (scene.renderer) {
        scene.renderer.setAnimationLoop(null); // Stop animation loop, TODO A-Frame should do this
      }
      document.body.removeChild(scene);
    }
  };

  const enterScene = async (mediaStream, enterInVR, hubId) => {
    const scene = document.querySelector("a-scene");
    scene.classList.add("no-cursor");
    scene.renderer.sortObjects = true;
    const playerRig = document.querySelector("#player-rig");
    document.querySelector("canvas").classList.remove("blurred");
    scene.render();

    if (enterInVR) {
      scene.enterVR();
    }

    AFRAME.registerInputActions(inGameActions, "default");

    scene.setAttribute("networked-scene", {
      room: hubId,
      serverURL: process.env.JANUS_SERVER
    });

    if (isDebug) {
      scene.setAttribute("networked-scene", { debug: true });
    }

    scene.setAttribute("stats-plus", false);

    if (isMobile || qsTruthy("mobile")) {
      playerRig.setAttribute("virtual-gamepad-controls", {});
    }

    const applyProfileOnPlayerRig = applyProfileFromStore.bind(null, playerRig);
    applyProfileOnPlayerRig();
    store.addEventListener("statechanged", applyProfileOnPlayerRig);

    const avatarScale = parseInt(qs.avatar_scale, 10);

    if (avatarScale) {
      playerRig.setAttribute("scale", { x: avatarScale, y: avatarScale, z: avatarScale });
    }

    const videoTracks = mediaStream ? mediaStream.getVideoTracks() : [];
    let sharingScreen = videoTracks.length > 0;

    const screenEntityId = `${NAF.clientId}-screen`;
    let screenEntity = document.getElementById(screenEntityId);

    scene.addEventListener("action_share_screen", () => {
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

    document.body.addEventListener("blocked", ev => {
      NAF.connection.entities.removeEntitiesOfClient(ev.detail.clientId);
    });

    document.body.addEventListener("unblocked", ev => {
      NAF.connection.entities.completeSync(ev.detail.clientId);
    });

    scene.addEventListener("add_media", e => {
      addMedia(e.detail);
    });

    if (qsTruthy("mediaTools")) {
      document.addEventListener("paste", e => {
        if (e.target.nodeName === "INPUT") return;

        const imgUrl = e.clipboardData.getData("text");
        console.log("Pasted: ", imgUrl, e);
        addMedia(imgUrl);
      });

      document.addEventListener("dragover", e => {
        e.preventDefault();
      });

      document.addEventListener("drop", e => {
        e.preventDefault();
        const imgUrl = e.dataTransfer.getData("url");
        if (imgUrl) {
          console.log("Droped: ", imgUrl);
          addMedia(imgUrl);
        }
      });
    }

    if (!qsTruthy("offline")) {
      document.body.addEventListener("connected", () => {
        if (!isBotMode) {
          hubChannel.sendEntryEvent().then(() => {
            store.update({ activity: { lastEnteredAt: new Date().toISOString() } });
          });
        }
        remountUI({ occupantCount: NAF.connection.adapter.publisher.initialOccupants.length + 1 });
      });

      document.body.addEventListener("clientConnected", () => {
        remountUI({
          occupantCount: Object.keys(NAF.connection.adapter.occupants).length + 1
        });
      });

      document.body.addEventListener("clientDisconnected", () => {
        remountUI({
          occupantCount: Object.keys(NAF.connection.adapter.occupants).length + 1
        });
      });

      scene.components["networked-scene"].connect().catch(connectError => {
        // hacky until we get return codes
        const isFull = connectError.error && connectError.error.msg.match(/\bfull\b/i);
        console.error(connectError);
        remountUI({ roomUnavailableReason: isFull ? "full" : "connect_error" });
        exitScene();

        return;
      });

      if (isDebug) {
        NAF.connection.adapter.session.options.verbose = true;
      }

      if (isBotMode) {
        playerRig.setAttribute("avatar-replay", {
          camera: "#player-camera",
          leftController: "#player-left-controller",
          rightController: "#player-right-controller",
          recordingUrl: "/assets/avatars/bot-recording.json"
        });

        const audioEl = document.createElement("audio");
        audioEl.loop = true;
        audioEl.muted = true;
        audioEl.crossorigin = "anonymous";
        audioEl.src = "/assets/avatars/bot-recording.mp3";
        document.body.appendChild(audioEl);

        // Wait for runner script to interact with the page so that we can play audio.
        const interacted = new Promise(resolve => {
          window.interacted = resolve;
        });
        const canPlay = new Promise(resolve => {
          audioEl.addEventListener("canplay", resolve);
        });
        await Promise.all([canPlay, interacted]);
        mediaStream.addTrack(audioEl.captureStream().getAudioTracks()[0]);
        audioEl.play();
      }

      if (mediaStream) {
        NAF.connection.adapter.setLocalMediaStream(mediaStream);

        if (screenEntity) {
          screenEntity.setAttribute("visible", sharingScreen);
        } else if (sharingScreen) {
          const sceneEl = document.querySelector("a-scene");
          screenEntity = document.createElement("a-entity");
          screenEntity.id = screenEntityId;
          screenEntity.setAttribute("offset-relative-to", {
            target: "#player-camera",
            offset: "0 0 -2",
            on: "action_share_screen"
          });
          screenEntity.setAttribute("networked", { template: "#video-template" });
          sceneEl.appendChild(screenEntity);
        }
      }
    }
  };

  const getPlatformUnsupportedReason = () => {
    if (typeof RTCDataChannelEvent === "undefined") {
      return "no_data_channels";
    }

    return null;
  };

  remountUI({ enterScene, exitScene });

  const platformUnsupportedReason = getPlatformUnsupportedReason();

  if (platformUnsupportedReason) {
    remountUI({ platformUnsupportedReason: platformUnsupportedReason });
    exitScene();
    return;
  }

  if (qs.required_version && qs.required_version !== process.env.BUILD_VERSION) {
    remountUI({ roomUnavailableReason: "version_mismatch" });
    setTimeout(() => document.location.reload(), 5000);
    exitScene();
    return;
  }

  getAvailableVREntryTypes().then(availableVREntryTypes => {
    if (availableVREntryTypes.gearvr === VR_DEVICE_AVAILABILITY.yes) {
      remountUI({ availableVREntryTypes, forcedVREntryType: "gearvr" });
    } else {
      remountUI({ availableVREntryTypes });
    }
  });

  const environmentRoot = document.querySelector("#environment-root");

  const initialEnvironmentEl = document.createElement("a-entity");
  initialEnvironmentEl.addEventListener("bundleloaded", () => {
    remountUI({ initialEnvironmentLoaded: true });
    // We never want to stop the render loop when were running in "bot" mode.
    if (!isBotMode) {
      // Stop rendering while the UI is up. We restart the render loop in enterScene.
      // Wait a tick plus some margin so that the environments actually render.
      setTimeout(() => scene.renderer.setAnimationLoop(null), 100);
    } else {
      const noop = () => {};
      // Replace renderer with a noop renderer to reduce bot resource usage.
      scene.renderer = { setAnimationLoop: noop, render: noop };
      document.body.style.display = "none";
    }
  });
  environmentRoot.appendChild(initialEnvironmentEl);

  const setRoom = (hubId, hubName) => {
    if (!isBotMode) {
      remountUI({ hubId, hubName });
    } else {
      const enterSceneImmediately = () => enterScene(new MediaStream(), false, hubId);
      if (scene.hasLoaded) {
        enterSceneImmediately();
      } else {
        scene.addEventListener("loaded", enterSceneImmediately);
      }
    }
  };

  if (qs.room) {
    // If ?room is set, this is `yarn start`, so just use a default environment and query string room.
    setRoom(qs.room || "default");
    initialEnvironmentEl.setAttribute("gltf-bundle", {
      src: DEFAULT_ENVIRONMENT_URL
    });
    return;
  }

  // Connect to reticulum over phoenix channels to get hub info.
  const hubId = qs.hub_id || document.location.pathname.substring(1).split("/")[0];
  console.log(`Hub ID: ${hubId}`);

  const socket = connectToReticulum();
  const channel = socket.channel(`hub:${hubId}`, {});

  channel
    .join()
    .receive("ok", data => {
      const hub = data.hubs[0];
      const defaultSpaceTopic = hub.topics[0];
      const gltfBundleUrl = defaultSpaceTopic.assets.find(a => a.asset_type === "gltf_bundle").src;
      setRoom(hub.hub_id, hub.name);
      initialEnvironmentEl.setAttribute("gltf-bundle", `src: ${gltfBundleUrl}`);
      hubChannel.setPhoenixChannel(channel);
    })
    .receive("error", res => {
      if (res.reason === "closed") {
        exitScene();
        remountUI({ roomUnavailableReason: "closed" });
      }

      console.error(res);
    });

  linkChannel.setSocket(socket);
};

document.addEventListener("DOMContentLoaded", onReady);
