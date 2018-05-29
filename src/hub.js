import "./assets/stylesheets/hub.scss";
import moment from "moment-timezone";
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
import "./components/pinch-to-move";
import "./components/look-on-mobile";
import "./components/camera-controller";

import ReactDOM from "react-dom";
import React from "react";
import UIRoot from "./react-components/ui-root";
import HubChannel from "./utils/hub-channel";
import LinkChannel from "./utils/link-channel";
import { connectToReticulum } from "./utils/phoenix-utils";
import { disableiOSZoom } from "./utils/disable-ios-zoom";

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
import TouchEventsHandler from "./utils/touch-events-handler.js";
import MouseEventsHandler from "./utils/mouse-events-handler.js";
import GearVRMouseEventsHandler from "./utils/gearvr-mouse-events-handler.js";
import PrimaryActionHandler from "./utils/primary-action-handler.js";


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
        scene.renderer.animate(null); // Stop animation loop, TODO A-Frame should do this
      }
      document.body.removeChild(scene);
    }
  };

  const enterScene = async (mediaStream, enterInVR, hubId) => {
    const scene = document.querySelector("a-scene");
    scene.style.cursor = "none";
    scene.renderer.sortObjects = true;
    const playerRig = document.querySelector("#player-rig");
    document.querySelector("canvas").classList.remove("blurred");
    scene.render();

    if (enterInVR) {
      scene.enterVR();
      if (isMobile) {
        // Set up GearVR event handling
        // TODO: Only use this when using gearvr
        window.APP.gearvrMouseEventsHandler = new GearVRMouseEventsHandler();
        const teleportEl = document.querySelector("#gaze-teleport");
        if (teleportEl && teleportEl.components && teleportEl.components["teleport-controls"]) {
          const teleportControls = teleportEl.components["teleport-controls"];
          window.APP.gearvrMouseEventsHandler.registerGazeTeleporter(teleportControls);
        } else {
          const registerTeleporter = e => {
            if (e.detail.name !== "teleport-controls") return;
            teleportEl.removeEventListener("componentinitialized", registerTeleporter);
            const teleportControls = teleportEl.components["teleport-controls"];
            window.APP.gearvrMouseEventsHandler.registerGazeTeleporter(teleportControls);
          };
          teleportEl.addEventListener("componentinitialized", registerTeleporter);
        }

        const cursorEl = document.querySelector("#cursor-controller");
        if (cursorEl && cursorEl.components && cursorEl.components["cursor-controller"]) {
          const cursor = cursorEl.components["cursor-controller"];
          window.APP.gearvrMouseEventsHandler.registerCursor(cursor);
        } else {
          const registerCursor = e => {
            if (e.detail.name !== "cursor-controller") return;
            cursorEl.removeEventListener("componentinitialized", registerCursor);
            const cursor = cursorEl.components["cursor-controller"];
            window.APP.gearvrMouseEventsHandler.registerCursor(cursor);
          };
          cursorEl.addEventListener("componentinitialized", registerCursor);
        }
      }

      // Set up event handling for anything emitting "action_primary_down/up" and "action_grab/release"
      window.APP.primaryActionHandler = new PrimaryActionHandler(scene);

      const cursorEl = document.querySelector("#cursor-controller");
      if (cursorEl && cursorEl.components && cursorEl.components["cursor-controller"]) {
        const cursor = cursorEl.components["cursor-controller"];
        window.APP.primaryActionHandler.registerCursor(cursor);
      } else {
        const registerCursor = e => {
          if (e.detail.name !== "cursor-controller") return;
          cursorEl.removeEventListener("componentinitialized", registerCursor);
          const cursor = cursorEl.components["cursor-controller"];
          window.APP.primaryActionHandler.registerCursor(cursor);
        };
        cursorEl.addEventListener("componentinitialized", registerCursor);
      }
    } else {
      if (isMobile) {
        window.APP.touchEventsHandler = new TouchEventsHandler();
      } else {
        window.APP.mouseEventsHandler = new MouseEventsHandler();
      }

      const camera = document.querySelector("#player-camera");
      const registerCameraController = e => {
        if (e.detail.name !== "camera-controller") return;
        camera.removeEventListener("componentinitialized", registerCameraController);

        if (window.APP.touchEventsHandler) {
          window.APP.touchEventsHandler.registerCameraController(camera.components["camera-controller"]);
          scene.components["look-on-mobile"].registerCameraController(camera.components["camera-controller"]);
          scene.setAttribute("look-on-mobile", "enabled", true);
        }

        if (window.APP.mouseEventsHandler) {
          window.APP.mouseEventsHandler.registerCameraController(camera.components["camera-controller"]);
          window.APP.mouseEventsHandler.setInverseMouseLook(qsTruthy("invertMouseLook"));
        }
      };
      camera.addEventListener("componentinitialized", registerCameraController);
      camera.setAttribute("camera-controller", "foo", "bar");

      const cursorEl = document.querySelector("#cursor-controller");
      if (cursorEl && cursorEl.components && cursorEl.components["cursor-controller"]) {
        const cursor = cursorEl.components["cursor-controller"];
        if (window.APP.touchEventsHandler) {
          window.APP.touchEventsHandler.registerPinchEmitter(cursorEl);
          window.APP.touchEventsHandler.registerCursor(cursor);
        }
        if (window.APP.mouseEventsHandler) {
          window.APP.mouseEventsHandler.registerCursor(cursor);
        }
      } else {
        const registerCursor = e => {
          if (e.detail.name !== "cursor-controller") return;
          cursorEl.removeEventListener("componentinitialized", registerCursor);
          const cursor = cursorEl.components["cursor-controller"];
          if (window.APP.touchEventsHandler) {
            window.APP.touchEventsHandler.registerPinchEmitter(cursorEl);
            window.APP.touchEventsHandler.registerCursor(cursor);
          }
          if (window.APP.mouseEventsHandler) {
            window.APP.mouseEventsHandler.registerCursor(cursor);
          }
        };
        cursorEl.addEventListener("componentinitialized", registerCursor);
      }
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

    if (!qsTruthy("offline")) {
      document.body.addEventListener("connected", () => {
        if (!isBotMode) {
          hubChannel.sendEntryEvent().then(() => {
            store.update({ activity: { lastEnteredAt: moment().toJSON() } });
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
          rightController: "#player-right-controller"
        });
        const audio = document.getElementById("bot-recording");
        mediaStream.addTrack(audio.captureStream().getAudioTracks()[0]);
        // Wait for runner script to interact with the page so that we can play audio.
        await new Promise(resolve => {
          window.interacted = resolve;
        });
        audio.play();
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
      setTimeout(() => scene.renderer.animate(null), 100);
    } else {
      const noop = () => {};
      // Replace renderer with a noop renderer to reduce bot resource usage.
      scene.renderer = { animate: noop, render: noop };
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
