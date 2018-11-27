console.log(`Hubs version: ${process.env.BUILD_VERSION || "?"}`);

import "./assets/stylesheets/hub.scss";

import "aframe";
import "./utils/logging";
import { patchWebGLRenderingContext } from "./utils/webgl";
patchWebGLRenderingContext();

import "three/examples/js/loaders/GLTFLoader";
import "networked-aframe/src/index";
import "naf-janus-adapter";
import "aframe-teleport-controls";
import "./components/teleport-controls-matrix-auto-update";
import "aframe-billboard-component";
import "aframe-rounded";
import "webrtc-adapter";
import "aframe-slice9-component";
import "aframe-motion-capture-components";
import "./utils/audio-context-fix";
import "./utils/threejs-positional-audio-updatematrixworld";
import "./utils/threejs-world-update";
import { getReticulumFetchUrl } from "./utils/phoenix-utils";

import nextTick from "./utils/next-tick";
import { addAnimationComponents } from "./utils/animation";
import { Presence } from "phoenix";

import "./components/scene-components";
import "./components/wasd-to-analog2d"; //Might be a behaviour or activator in the future
import "./components/mute-mic";
import "./components/bone-mute-state-indicator";
import "./components/bone-visibility";
import "./components/in-world-hud";
import "./components/virtual-gamepad-controls";
import "./components/ik-controller";
import "./components/hand-controls2";
import "./components/character-controller";
import "./components/hoverable-visuals";
import "./components/hover-visuals";
import "./components/haptic-feedback";
import "./components/offset-relative-to";
import "./components/player-info";
import "./components/debug";
import "./components/hand-poses";
import "./components/gltf-bundle";
import "./components/hud-controller";
import "./components/freeze-controller";
import "./components/icon-button";
import "./components/text-button";
import "./components/block-button";
import "./components/visible-while-frozen";
import "./components/stats-plus";
import "./components/networked-avatar";
import "./components/avatar-replay";
import "./components/media-views";
import "./components/pinch-to-move";
import "./components/pitch-yaw-rotator";
import "./components/auto-scale-cannon-physics-body";
import "./components/position-at-box-shape-border";
import "./components/pinnable";
import "./components/pin-networked-object-button";
import "./components/remove-networked-object-button";
import "./components/camera-focus-button";
import "./components/mirror-camera-button";
import "./components/destroy-at-extreme-distances";
import "./components/gamma-factor";
import "./components/visible-to-owner";
import "./components/camera-tool";
import "./components/scene-sound";
import "./components/emit-state-change";
import "./components/action-to-event";
import "./components/emit-scene-event-on-remove";
import "./components/stop-event-propagation";
import "./components/animation";
import "./components/follow-in-lower-fov";
import "./components/matrix-auto-update";

import ReactDOM from "react-dom";
import React from "react";
import UIRoot from "./react-components/ui-root";
import HubChannel from "./utils/hub-channel";
import LinkChannel from "./utils/link-channel";
import { connectToReticulum } from "./utils/phoenix-utils";
import { disableiOSZoom } from "./utils/disable-ios-zoom";
import { proxiedUrlFor } from "./utils/media-utils";
import MessageDispatch from "./message-dispatch";
import SceneEntryManager from "./scene-entry-manager";
import Subscriptions from "./subscriptions";
import { createInWorldLogMessage } from "./react-components/chat-message";

import "./systems/nav";
import "./systems/personal-space-bubble";
import "./systems/app-mode";
import "./systems/exit-on-blur";
import "./systems/camera-tools";
import "./systems/userinput/userinput";
import "./systems/camera-mirror";
import "./systems/userinput/userinput-debug";
import "./systems/frame-scheduler";

import "./gltf-component-mappings";

import { App } from "./App";

window.APP = new App();
window.APP.RENDER_ORDER = {
  HUD_BACKGROUND: 1,
  HUD_ICONS: 2,
  CURSOR: 3
};
const store = window.APP.store;

const qs = new URLSearchParams(location.search);
const isMobile = AFRAME.utils.device.isMobile();

THREE.Object3D.DefaultMatrixAutoUpdate = false;
window.APP.quality = qs.get("quality") || isMobile ? "low" : "high";

import "aframe-physics-system";
import "aframe-physics-extras";
import "super-hands";
import "./components/super-networked-interactable";
import "./components/networked-counter";
import "./components/event-repeater";
import "./components/controls-shape-offset";
import "./components/set-yxz-order";
import "./components/set-sounds-invisible";

import "./components/cardboard-controls";

import "./components/cursor-controller";

import "./components/nav-mesh-helper";

import "./components/tools/pen";
import "./components/tools/networked-drawing";
import "./components/tools/drawing-manager";

import registerNetworkSchemas from "./network-schemas";
import registerTelemetry from "./telemetry";
import { warmSerializeElement } from "./utils/serialize-element";

import { getAvailableVREntryTypes } from "./utils/vr-caps-detect.js";
import ConcurrentLoadDetector from "./utils/concurrent-load-detector.js";

import qsTruthy from "./utils/qs_truthy";

const isBotMode = qsTruthy("bot");
const isTelemetryDisabled = qsTruthy("disable_telemetry");
const isDebug = qsTruthy("debug");

if (!isBotMode && !isTelemetryDisabled) {
  registerTelemetry();
}

disableiOSZoom();

const concurrentLoadDetector = new ConcurrentLoadDetector();
concurrentLoadDetector.start();

store.init();

function getPlatformUnsupportedReason() {
  if (typeof RTCDataChannelEvent === "undefined") return "no_data_channels";
  return null;
}

function pollForSupportAvailability(callback) {
  const availabilityUrl = getReticulumFetchUrl("/api/v1/support/availability");
  let isSupportAvailable = null;

  const updateIfChanged = () =>
    fetch(availabilityUrl).then(({ ok }) => {
      if (isSupportAvailable === ok) return;
      isSupportAvailable = ok;
      callback(isSupportAvailable);
    });

  updateIfChanged();
  setInterval(updateIfChanged, 30000);
}

function setupLobbyCamera() {
  const camera = document.querySelector("#player-camera");
  const previewCamera = document.querySelector("#environment-scene").object3D.getObjectByName("scene-preview-camera");

  if (previewCamera) {
    camera.object3D.position.copy(previewCamera.position);
    camera.object3D.rotation.copy(previewCamera.rotation);
    camera.object3D.rotation.reorder("YXZ");
  } else {
    const cameraPos = camera.object3D.position;
    camera.object3D.position.set(cameraPos.x, 2.5, cameraPos.z);
  }

  camera.object3D.matrixNeedsUpdate = true;

  camera.setAttribute("scene-preview-camera", "positionOnly: true; duration: 60");
  camera.components["pitch-yaw-rotator"].set(camera.object3D.rotation.x, camera.object3D.rotation.y);
}

let uiProps = {};

function mountUI(props = {}) {
  const scene = document.querySelector("a-scene");
  const disableAutoExitOnConcurrentLoad = qsTruthy("allow_multi");
  const forcedVREntryType = qs.get("vr_entry_type");

  ReactDOM.render(
    <UIRoot
      {...{
        scene,
        isBotMode,
        concurrentLoadDetector,
        disableAutoExitOnConcurrentLoad,
        forcedVREntryType,
        store,
        ...props
      }}
    />,
    document.getElementById("ui-root")
  );
}

function remountUI(props) {
  uiProps = { ...uiProps, ...props };
  mountUI(uiProps);
}

async function handleHubChannelJoined(entryManager, hubChannel, messageDispatch, data) {
  const scene = document.querySelector("a-scene");

  if (NAF.connection.isConnected()) {
    // Send complete sync on phoenix re-join.
    NAF.connection.entities.completeSync(null, true);
    return;
  }

  const hub = data.hubs[0];
  const defaultSpaceTopic = hub.topics[0];
  const glbAsset = defaultSpaceTopic.assets.find(a => a.asset_type === "glb");
  const bundleAsset = defaultSpaceTopic.assets.find(a => a.asset_type === "gltf_bundle");
  const sceneUrl = (glbAsset || bundleAsset).src;
  const hasExtension = /\.gltf/i.test(sceneUrl) || /\.glb/i.test(sceneUrl);

  console.log(`Scene URL: ${sceneUrl}`);
  const environmentScene = document.querySelector("#environment-scene");
  const objectsScene = document.querySelector("#objects-scene");
  const objectsUrl = getReticulumFetchUrl(`/${hub.hub_id}/objects.gltf`);
  const objectsEl = document.createElement("a-entity");
  objectsEl.setAttribute("gltf-model-plus", { src: objectsUrl, useCache: false, inflate: true });
  objectsScene.appendChild(objectsEl);

  if (glbAsset || hasExtension) {
    const gltfEl = document.createElement("a-entity");
    gltfEl.setAttribute("gltf-model-plus", { src: proxiedUrlFor(sceneUrl), useCache: false, inflate: true });
    gltfEl.addEventListener("model-loaded", () => environmentScene.emit("bundleloaded"));
    environmentScene.appendChild(gltfEl);
  } else {
    // TODO kill bundles
    environmentScene.setAttribute("gltf-bundle", `src: ${sceneUrl}`);
  }

  remountUI({
    hubId: hub.hub_id,
    hubName: hub.name,
    hubEntryCode: hub.entry_code,
    onSendMessage: messageDispatch.dispatch
  });

  document
    .querySelector("#hud-hub-entry-link")
    .setAttribute("text", { value: `hub.link/${hub.entry_code}`, width: 1.1, align: "center" });

  // Wait for scene objects to load before connecting, so there is no race condition on network state.
  objectsEl.addEventListener("model-loaded", async el => {
    if (el.target !== objectsEl) return;

    scene.setAttribute("networked-scene", {
      room: hub.hub_id,
      serverURL: process.env.JANUS_SERVER,
      debug: !!isDebug
    });

    while (!scene.components["networked-scene"] || !scene.components["networked-scene"].data) await nextTick();

    scene.components["networked-scene"]
      .connect()
      .then(() => {
        NAF.connection.adapter.reliableTransport = (clientId, dataType, data) => {
          const payload = { dataType, data };

          if (clientId) {
            payload.clientId = clientId;
          }

          hubChannel.channel.push("naf", payload);
        };
      })
      .catch(connectError => {
        // hacky until we get return codes
        const isFull = connectError.error && connectError.error.msg.match(/\bfull\b/i);
        console.error(connectError);
        remountUI({ roomUnavailableReason: isFull ? "full" : "connect_error" });
        entryManager.exitScene();

        return;
      });
  });
}

async function runBotMode(scene, entryManager) {
  const noop = () => {};
  scene.renderer = { setAnimationLoop: noop, render: noop };

  while (!NAF.connection.isConnected()) await nextTick();
  entryManager.enterSceneWhenLoaded(new MediaStream(), false);
}

document.addEventListener("DOMContentLoaded", async () => {
  warmSerializeElement();

  const hubId = qs.get("hub_id") || document.location.pathname.substring(1).split("/")[0];
  console.log(`Hub ID: ${hubId}`);

  const subscriptions = new Subscriptions(hubId);

  if (navigator.serviceWorker) {
    try {
      navigator.serviceWorker
        .register("/hub.service.js")
        .then(() => {
          navigator.serviceWorker.ready
            .then(registration => subscriptions.setRegistration(registration))
            .catch(() => subscriptions.setRegistrationFailed());
        })
        .catch(() => subscriptions.setRegistrationFailed());
    } catch (e) {
      subscriptions.setRegistrationFailed();
    }
  }

  const scene = document.querySelector("a-scene");
  scene.removeAttribute("keyboard-shortcuts"); // Remove F and ESC hotkeys from aframe

  const hubChannel = new HubChannel(store);
  const entryManager = new SceneEntryManager(hubChannel);
  entryManager.init();

  const linkChannel = new LinkChannel(store);

  window.APP.scene = scene;

  scene.addEventListener("enter-vr", () => {
    document.body.classList.add("vr-mode");

    if (!scene.is("entered")) {
      // If VR headset is activated, refreshing page will fire vrdisplayactivate
      // which puts A-Frame in VR mode, so exit VR mode whenever it is attempted
      // to be entered and we haven't entered the room yet.
      console.log("Pre-emptively exiting VR mode.");
      scene.exitVR();
    }
  });

  scene.addEventListener("exit-vr", () => document.body.classList.remove("vr-mode"));

  registerNetworkSchemas();

  remountUI({
    hubChannel,
    linkChannel,
    subscriptions,
    enterScene: entryManager.enterScene,
    exitScene: entryManager.exitScene,
    initialIsSubscribed: subscriptions.isSubscribed()
  });

  scene.addEventListener("action_focus_chat", () => document.querySelector(".chat-focus-target").focus());

  pollForSupportAvailability(isSupportAvailable => remountUI({ isSupportAvailable }));

  const platformUnsupportedReason = getPlatformUnsupportedReason();

  if (platformUnsupportedReason) {
    remountUI({ platformUnsupportedReason });
    entryManager.exitScene();
    return;
  }

  if (qs.get("required_version") && process.env.BUILD_VERSION) {
    const buildNumber = process.env.BUILD_VERSION.split(" ", 1)[0]; // e.g. "123 (abcd5678)"

    if (qs.get("required_version") !== buildNumber) {
      remountUI({ roomUnavailableReason: "version_mismatch" });
      setTimeout(() => document.location.reload(), 5000);
      entryManager.exitScene();
      return;
    }
  }

  const availableVREntryTypes = await getAvailableVREntryTypes();

  if (availableVREntryTypes.isInHMD) {
    remountUI({ availableVREntryTypes, forcedVREntryType: "vr" });

    if (/Oculus/.test(navigator.userAgent)) {
      // HACK - The polyfill reports Cardboard as the primary VR display on startup out ahead of Oculus Go on Oculus Browser 5.5.0 beta. This display is cached by A-Frame,
      // so we need to resolve that and get the real VRDisplay before entering as well.
      const displays = await navigator.getVRDisplays();
      const vrDisplay = displays.length && displays[0];
      AFRAME.utils.device.getVRDisplay = () => vrDisplay;
    }
  } else {
    remountUI({ availableVREntryTypes });
  }

  const environmentScene = document.querySelector("#environment-scene");

  environmentScene.addEventListener("bundleloaded", () => {
    remountUI({ environmentSceneLoaded: true });

    for (const modelEl of environmentScene.children) {
      addAnimationComponents(modelEl);
    }

    setupLobbyCamera();

    // Replace renderer with a noop renderer to reduce bot resource usage.
    if (isBotMode) {
      runBotMode(scene, entryManager);
    }
  });

  const socket = connectToReticulum(isDebug);
  remountUI({ sessionId: socket.params().session_id });

  // Hub local channel
  const context = {
    mobile: isMobile,
    hmd: availableVREntryTypes.isInHMD
  };

  // Reticulum global channel
  const retPhxChannel = socket.channel(`ret`, { hub_id: hubId });
  retPhxChannel
    .join()
    .receive("ok", async data => subscriptions.setVapidPublicKey(data.vapid_public_key))
    .receive("error", res => {
      subscriptions.setVapidPublicKey(null);
      console.error(res);
    });

  const pushSubscriptionEndpoint = await subscriptions.getCurrentEndpoint();
  const joinPayload = { profile: store.state.profile, push_subscription_endpoint: pushSubscriptionEndpoint, context };
  const hubPhxChannel = socket.channel(`hub:${hubId}`, joinPayload);

  const presenceLogEntries = [];
  const addToPresenceLog = entry => {
    entry.key = Date.now().toString();

    presenceLogEntries.push(entry);
    remountUI({ presenceLogEntries });
    scene.emit(`presence-log-${entry.type}`);

    // Fade out and then remove
    setTimeout(() => {
      entry.expired = true;
      remountUI({ presenceLogEntries });

      setTimeout(() => {
        presenceLogEntries.splice(presenceLogEntries.indexOf(entry), 1);
        remountUI({ presenceLogEntries });
      }, 5000);
    }, 20000);
  };

  const messageDispatch = new MessageDispatch(scene, entryManager, hubChannel, addToPresenceLog, remountUI);

  hubPhxChannel
    .join()
    .receive("ok", async data => {
      hubChannel.setPhoenixChannel(hubPhxChannel);
      subscriptions.setHubChannel(hubChannel);
      subscriptions.setSubscribed(data.subscriptions.web_push);
      remountUI({ initialIsSubscribed: subscriptions.isSubscribed() });
      await handleHubChannelJoined(entryManager, hubChannel, messageDispatch, data);
    })
    .receive("error", res => {
      if (res.reason === "closed") {
        entryManager.exitScene();
        remountUI({ roomUnavailableReason: "closed" });
      }

      console.error(res);
    });

  const hubPhxPresence = new Presence(hubPhxChannel);

  let isInitialSync = true;
  const vrHudPresenceCount = document.querySelector("#hud-presence-count");

  hubPhxPresence.onSync(() => {
    remountUI({ presences: hubPhxPresence.state });
    const occupantCount = Object.entries(hubPhxPresence.state).length;
    vrHudPresenceCount.setAttribute("text", "value", occupantCount.toString());

    if (!isInitialSync) return;
    // Wire up join/leave event handlers after initial sync.
    isInitialSync = false;

    hubPhxPresence.onJoin((sessionId, current, info) => {
      const meta = info.metas[info.metas.length - 1];

      if (current) {
        // Change to existing presence
        const isSelf = sessionId === socket.params().session_id;
        const currentMeta = current.metas[0];

        if (!isSelf && currentMeta.presence !== meta.presence && meta.profile.displayName) {
          addToPresenceLog({
            type: "entered",
            presence: meta.presence,
            name: meta.profile.displayName
          });
        }

        if (currentMeta.profile && meta.profile && currentMeta.profile.displayName !== meta.profile.displayName) {
          addToPresenceLog({
            type: "display_name_changed",
            oldName: currentMeta.profile.displayName,
            newName: meta.profile.displayName
          });
        }
      } else {
        // New presence
        const meta = info.metas[0];

        if (meta.presence && meta.profile.displayName) {
          addToPresenceLog({
            type: "join",
            presence: meta.presence,
            name: meta.profile.displayName
          });
        }
      }
    });

    hubPhxPresence.onLeave((sessionId, current, info) => {
      if (current && current.metas.length > 0) return;

      const meta = info.metas[0];

      if (meta.profile.displayName) {
        addToPresenceLog({
          type: "leave",
          name: meta.profile.displayName
        });
      }
    });
  });

  hubPhxChannel.on("naf", data => {
    if (!NAF.connection.adapter) return;
    NAF.connection.adapter.onData(data);
  });

  hubPhxChannel.on("message", ({ session_id, type, body }) => {
    const userInfo = hubPhxPresence.state[session_id];
    if (!userInfo) return;
    const maySpawn = scene.is("entered");

    const incomingMessage = { name: userInfo.metas[0].profile.displayName, type, body, maySpawn };

    if (scene.is("vr-mode")) {
      createInWorldLogMessage(incomingMessage);
    }

    addToPresenceLog(incomingMessage);
  });

  linkChannel.setSocket(socket);
});
