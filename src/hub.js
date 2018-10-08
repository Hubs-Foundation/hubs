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
import "aframe-input-mapping-component";
import "aframe-billboard-component";
import "aframe-rounded";
import "webrtc-adapter";
import "aframe-slice9-component";
import "aframe-motion-capture-components";
import "./utils/audio-context-fix";
import { getReticulumFetchUrl } from "./utils/phoenix-utils";

import nextTick from "./utils/next-tick";
import { addAnimationComponents } from "./utils/animation";

import trackpad_dpad4 from "./behaviours/trackpad-dpad4";
import trackpad_scrolling from "./behaviours/trackpad-scrolling";
import joystick_dpad4 from "./behaviours/joystick-dpad4";
import msft_mr_axis_with_deadzone from "./behaviours/msft-mr-axis-with-deadzone";
import { PressedMove } from "./activators/pressedmove";
import { ReverseY } from "./activators/reversey";

import "./activators/shortpress";

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
import "./components/haptic-feedback";
import "./components/networked-video-player";
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
import "./components/look-on-mobile";
import "./components/pitch-yaw-rotator";
import "./components/input-configurator";
import "./components/auto-scale-cannon-physics-body";
import "./components/position-at-box-shape-border";
import "./components/remove-networked-object-button";
import "./components/destroy-at-extreme-distances";
import "./components/gamma-factor";
import "./components/visible-to-owner";
import "./components/camera-tool";

import ReactDOM from "react-dom";
import React from "react";
import UIRoot from "./react-components/ui-root";
import HubChannel from "./utils/hub-channel";
import LinkChannel from "./utils/link-channel";
import { connectToReticulum } from "./utils/phoenix-utils";
import { disableiOSZoom } from "./utils/disable-ios-zoom";
import { proxiedUrlFor } from "./utils/media-utils";
import SceneEntryManager from "./scene-entry-manager";

import "./systems/nav";
import "./systems/personal-space-bubble";
import "./systems/app-mode";
import "./systems/exit-on-blur";

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

window.APP.quality = qs.get("quality") || isMobile ? "low" : "high";

import "aframe-physics-system";
import "aframe-physics-extras";
import "super-hands";
import "./components/super-networked-interactable";
import "./components/networked-counter";
import "./components/event-repeater";
import "./components/controls-shape-offset";
import "./components/grabbable-toggle";

import "./components/cardboard-controls";

import "./components/cursor-controller";

import "./components/nav-mesh-helper";
import "./systems/tunnel-effect";

import "./components/tools/pen";
import "./components/tools/networked-drawing";
import "./components/tools/drawing-manager";

import registerNetworkSchemas from "./network-schemas";
import { config as inputConfig } from "./input-mappings";
import registerTelemetry from "./telemetry";

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
    camera.object3D.updateMatrix();
  } else {
    const cameraPos = camera.object3D.position;
    camera.object3D.position.set(cameraPos.x, 2.5, cameraPos.z);
  }

  camera.setAttribute("scene-preview-camera", "positionOnly: true; duration: 60");
  camera.components["pitch-yaw-rotator"].set(camera.object3D.rotation.x, camera.object3D.rotation.y);
}

let uiProps = {};

function mountUI(props = {}) {
  const scene = document.querySelector("a-scene");
  const disableAutoExitOnConcurrentLoad = qsTruthy("allow_multi");
  const forcedVREntryType = qs.get("vr_entry_type");
  const enableScreenSharing = qsTruthy("enable_screen_sharing");

  ReactDOM.render(
    <UIRoot
      {...{
        scene,
        isBotMode,
        concurrentLoadDetector,
        disableAutoExitOnConcurrentLoad,
        forcedVREntryType,
        enableScreenSharing,
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

async function handleHubChannelJoined(entryManager, hubChannel, data) {
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

  if (glbAsset || hasExtension) {
    const gltfEl = document.createElement("a-entity");
    gltfEl.setAttribute("gltf-model-plus", { src: proxiedUrlFor(sceneUrl), useCache: false, inflate: true });
    gltfEl.addEventListener("model-loaded", () => environmentScene.emit("bundleloaded"));
    environmentScene.appendChild(gltfEl);
  } else {
    // TODO kill bundles
    environmentScene.setAttribute("gltf-bundle", `src: ${sceneUrl}`);
  }

  remountUI({ hubId: hub.hub_id, hubName: hub.name, hubEntryCode: hub.entry_code });

  document
    .querySelector("#hud-hub-entry-link")
    .setAttribute("text", { value: `hub.link/${hub.entry_code}`, width: 1.1, align: "center" });

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
}

async function runBotMode(scene, entryManager) {
  const noop = () => {};
  scene.renderer = { setAnimationLoop: noop, render: noop };

  while (!NAF.connection.isConnected()) await nextTick();
  entryManager.enterSceneWhenLoaded(new MediaStream(), false);
}

document.addEventListener("DOMContentLoaded", () => {
  const scene = document.querySelector("a-scene");
  const hubChannel = new HubChannel(store);
  const entryManager = new SceneEntryManager(hubChannel);
  entryManager.init();

  const linkChannel = new LinkChannel(store);

  window.APP.scene = scene;

  registerNetworkSchemas();
  remountUI({ hubChannel, linkChannel, enterScene: entryManager.enterScene, exitScene: entryManager.exitScene });

  pollForSupportAvailability(isSupportAvailable => remountUI({ isSupportAvailable }));

  document.body.addEventListener("connected", () =>
    remountUI({ occupantCount: NAF.connection.adapter.publisher.initialOccupants.length + 1 })
  );

  document.body.addEventListener("clientConnected", () =>
    remountUI({
      occupantCount: Object.keys(NAF.connection.adapter.occupants).length + 1
    })
  );

  document.body.addEventListener("clientDisconnected", () =>
    remountUI({
      occupantCount: Object.keys(NAF.connection.adapter.occupants).length + 1
    })
  );

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

  getAvailableVREntryTypes().then(availableVREntryTypes => {
    if (availableVREntryTypes.isInHMD) {
      remountUI({ availableVREntryTypes, forcedVREntryType: "vr" });
    } else {
      remountUI({ availableVREntryTypes });
    }
  });

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

  // Connect to reticulum over phoenix channels to get hub info.
  const hubId = qs.get("hub_id") || document.location.pathname.substring(1).split("/")[0];
  console.log(`Hub ID: ${hubId}`);

  const socket = connectToReticulum(isDebug);
  const channel = socket.channel(`hub:${hubId}`, {});

  channel
    .join()
    .receive("ok", async data => {
      hubChannel.setPhoenixChannel(channel);
      await handleHubChannelJoined(entryManager, hubChannel, data);
    })
    .receive("error", res => {
      if (res.reason === "closed") {
        entryManager.exitScene();
        remountUI({ roomUnavailableReason: "closed" });
      }

      console.error(res);
    });

  channel.on("naf", data => {
    if (!NAF.connection.adapter) return;
    NAF.connection.adapter.onData(data);
  });

  linkChannel.setSocket(socket);
});
