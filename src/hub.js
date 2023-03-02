import {
  getCurrentHubId,
  updateVRHudPresenceCount,
  updateSceneCopresentState,
  createHubChannelParams
} from "./utils/hub-utils";
import "./utils/debug-log";
import configs from "./utils/configs";
import "./utils/theme";

import "core-js/stable";
import "regenerator-runtime/runtime";

console.log(
  `App version: ${
    configs.IS_LOCAL_OR_CUSTOM_CLIENT
      ? `Custom client or local client (undeploy custom client to run build ${process.env.BUILD_VERSION})`
      : process.env.BUILD_VERSION || "?"
  }`
);

import "./react-components/styles/global.scss";
import "./assets/stylesheets/globals.scss";
import "./assets/stylesheets/hub.scss";
import loadingEnvironment from "./assets/models/LoadingEnvironment.glb";

import "aframe";
import "./utils/aframe-overrides";

// A-Frame hardcodes THREE.Cache.enabled = true
// But we don't want to use THREE.Cache because
// web browser cache should work well.
// So we disable it here.
import * as THREE from "three";
THREE.Cache.enabled = false;
THREE.Object3D.DefaultMatrixAutoUpdate = false;

import "./utils/logging";
import { patchWebGLRenderingContext } from "./utils/webgl";
patchWebGLRenderingContext();

import "networked-aframe/src/index";
import "webrtc-adapter";
import { detectOS, detect } from "detect-browser";
import {
  getReticulumFetchUrl,
  getReticulumMeta,
  migrateChannelToSocket,
  connectToReticulum,
  denoisePresence,
  presenceEventsForHub,
  tryGetMatchingMeta
} from "./utils/phoenix-utils";
import { Presence } from "phoenix";
import { emitter } from "./emitter";
import "./phoenix-adapter";

import nextTick from "./utils/next-tick";
import { addAnimationComponents } from "./utils/animation";
import Cookies from "js-cookie";
import { DIALOG_CONNECTION_ERROR_FATAL, DIALOG_CONNECTION_CONNECTED } from "./naf-dialog-adapter";
import "./change-hub";

import "./components/scene-components";
import "./components/mute-mic";
import "./components/bone-mute-state-indicator";
import "./components/bone-visibility";
import "./components/fader";
import "./components/in-world-hud";
import "./components/emoji";
import "./components/emoji-hud";
import "./components/virtual-gamepad-controls";
import "./components/ik-controller";
import "./components/hand-controls2";
import "./components/hoverable-visuals";
import "./components/hover-visuals";
import "./components/offset-relative-to";
import "./components/player-info";
import "./components/name-tag";
import "./components/debug";
import "./components/hand-poses";
import "./components/hud-controller";
import "./components/freeze-controller";
import "./components/icon-button";
import "./components/text-button";
import "./components/block-button";
import "./components/mute-button";
import "./components/kick-button";
import "./components/close-vr-notice-button";
import "./components/leave-room-button";
import "./components/visible-if-permitted";
import "./components/visibility-on-content-types";
import "./components/hide-when-pinned-and-forbidden";
import "./components/visibility-while-frozen";
import "./components/stats-plus";
import "./components/networked-avatar";
import "./components/media-video";
import "./components/media-pdf";
import "./components/media-image";
import "./components/avatar-volume-controls";
import "./components/pinch-to-move";
import "./components/pitch-yaw-rotator";
import "./components/position-at-border";
import "./components/pinnable";
import "./components/pin-networked-object-button";
import "./components/mirror-media-button";
import "./components/close-mirrored-media-button";
import "./components/drop-object-button";
import "./components/camera-focus-button";
import "./components/unmute-video-button";
import "./components/visible-to-owner";
import "./components/emit-state-change";
import "./components/action-to-event";
import "./components/action-to-remove";
import "./components/emit-scene-event-on-remove";
import "./components/follow-in-fov";
import "./components/clone-media-button";
import "./components/open-media-button";
import "./components/refresh-media-button";
import "./components/tweet-media-button";
import "./components/remix-avatar-button";
import "./components/transform-object-button";
import "./components/scale-button";
import "./components/hover-menu";
import "./components/disable-frustum-culling";
import "./components/teleporter";
import "./components/track-pose";
import "./components/replay";
import "./components/visibility-by-path";
import "./components/tags";
import "./components/periodic-full-syncs";
import "./components/inspect-button";
import "./components/inspect-pivot-child-selector";
import "./components/inspect-pivot-offset-from-camera";
import "./components/optional-alternative-to-not-hide";
import "./components/avatar-audio-source";
import "./components/avatar-inspect-collider";
import "./components/video-texture-target";
import "./components/mirror";

import ReactDOM from "react-dom";
import React from "react";
import { Router, Route } from "react-router-dom";
import { createBrowserHistory, createMemoryHistory } from "history";
import { pushHistoryState } from "./utils/history";
import UIRoot from "./react-components/ui-root";
import { ExitedRoomScreenContainer } from "./react-components/room/ExitedRoomScreenContainer";
import AuthChannel from "./utils/auth-channel";
import HubChannel from "./utils/hub-channel";
import LinkChannel from "./utils/link-channel";
import { disableiOSZoom } from "./utils/disable-ios-zoom";
import { proxiedUrlFor } from "./utils/media-url-utils";
import { traverseMeshesAndAddShapes } from "./utils/physics-utils";
import { handleExitTo2DInterstitial, exit2DInterstitialAndEnterVR } from "./utils/vr-interstitial";
import { getAvatarSrc } from "./utils/avatar-utils.js";
import MessageDispatch from "./message-dispatch";
import SceneEntryManager from "./scene-entry-manager";
import Subscriptions from "./subscriptions";
import { createInWorldLogMessage } from "./react-components/chat-message";

import "./systems/nav";
import "./systems/frame-scheduler";
import "./systems/personal-space-bubble";
import "./systems/app-mode";
import "./systems/permissions";
import "./systems/exit-on-blur";
import "./systems/auto-pixel-ratio";
import "./systems/idle-detector";
import "./systems/pen-tools";
import "./systems/userinput/userinput";
import "./systems/userinput/userinput-debug";
import "./systems/ui-hotkeys";
import "./systems/tips";
import "./systems/interactions";
import "./systems/hubs-systems";
import "./systems/capture-system";
import "./systems/listed-media";
import "./systems/linked-media";
import "./systems/audio-debug-system";
import "./systems/audio-gain-system";

import "./gltf-component-mappings";

import { App, getScene } from "./app";
import MediaDevicesManager from "./utils/media-devices-manager";
import PinningHelper from "./utils/pinning-helper";
import { sleep } from "./utils/async-utils";
import { platformUnsupported } from "./support";
import { renderAsEntity } from "./utils/jsx-entity";
import { VideoMenuPrefab } from "./prefabs/video-menu";
import { ObjectMenuPrefab } from "./prefabs/object-menu";
import { preload } from "./utils/preload";

window.APP = new App();
renderAsEntity(APP.world, VideoMenuPrefab());
renderAsEntity(APP.world, VideoMenuPrefab());
function addToScene(entityDef, visible) {
  return getScene().then(scene => {
    const eid = renderAsEntity(APP.world, entityDef);
    const obj = APP.world.eid2obj.get(eid);
    scene.add(obj);
    obj.visible = !!visible;
  });
}
preload(addToScene(ObjectMenuPrefab(), false));
preload(addToScene(ObjectMenuPrefab(), false));

const store = window.APP.store;
store.update({ preferences: { shouldPromptForRefresh: false } }); // Clear flag that prompts for refresh from preference screen
const mediaSearchStore = window.APP.mediaSearchStore;
const OAUTH_FLOW_PERMS_TOKEN_KEY = "ret-oauth-flow-perms-token";
const NOISY_OCCUPANT_COUNT = 30; // Above this # of occupants, we stop posting join/leaves/renames

const qs = new URLSearchParams(location.search);
const isMobile = AFRAME.utils.device.isMobile();
const isMobileVR = AFRAME.utils.device.isMobileVR();
const isEmbed = window.self !== window.top;
if (isEmbed && !qs.get("embed_token")) {
  // Should be covered by X-Frame-Options, but just in case.
  throw new Error("no embed token");
}

import "./components/owned-object-limiter";
import "./components/owned-object-cleanup-timeout";
import "./components/set-unowned-body-kinematic";
import "./components/scalable-when-grabbed";
import "./components/networked-counter";
import "./components/event-repeater";
import "./components/set-yxz-order";

import "./components/cursor-controller";

import "./components/tools/pen";
import "./components/tools/pen-laser";
import "./components/tools/networked-drawing";
import "./components/tools/drawing-manager";

import "./components/body-helper";
import "./components/shape-helper";

import registerNetworkSchemas from "./network-schemas";
import registerTelemetry from "./telemetry";

import { getAvailableVREntryTypes, VR_DEVICE_AVAILABILITY, ONLY_SCREEN_AVAILABLE } from "./utils/vr-caps-detect";
import detectConcurrentLoad from "./utils/concurrent-load-detector";

import qsTruthy from "./utils/qs_truthy";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import { ExitReason } from "./react-components/room/ExitedRoomScreen";
import { OAuthScreenContainer } from "./react-components/auth/OAuthScreenContainer";
import { SignInMessages } from "./react-components/auth/SignInModal";
import { ThemeProvider } from "./react-components/styles/theme";
import { LogMessageType } from "./react-components/room/ChatSidebar";
import "./load-media-on-paste-or-drop";
import { swapActiveScene } from "./bit-systems/scene-loading";
import { setLocalClientID } from "./bit-systems/networking";
import { listenForNetworkMessages } from "./utils/listen-for-network-messages";
import { exposeBitECSDebugHelpers } from "./bitecs-debug-helpers";

const PHOENIX_RELIABLE_NAF = "phx-reliable";
NAF.options.firstSyncSource = PHOENIX_RELIABLE_NAF;
NAF.options.syncSource = PHOENIX_RELIABLE_NAF;

let isOAuthModal = false;

// OAuth popup handler
// TODO: Replace with a new oauth callback route that has this postMessage script.
try {
  if (window.opener && window.opener.doingTwitterOAuth) {
    window.opener.postMessage("oauth-successful");
    isOAuthModal = true;
    window.close();
  }
} catch (e) {
  console.error("Exception in oauth processing code", e);
}

const isBotMode = qsTruthy("bot");
const isTelemetryDisabled = qsTruthy("disable_telemetry");
const isDebug = qsTruthy("debug");

if (!isBotMode && !isTelemetryDisabled) {
  registerTelemetry("/hub", "Room Landing Page");
}

disableiOSZoom();

if (!isOAuthModal) {
  detectConcurrentLoad();
}

if (qsTruthy("ecsDebug")) {
  exposeBitECSDebugHelpers();
}

function setupLobbyCamera() {
  console.log("Setting up lobby camera");
  const camera = document.getElementById("scene-preview-node");
  const previewCamera = document.getElementById("environment-scene").object3D.getObjectByName("scene-preview-camera");

  if (previewCamera) {
    camera.object3D.position.copy(previewCamera.position);
    camera.object3D.rotation.copy(previewCamera.rotation);
    camera.object3D.rotation.reorder("YXZ");
  } else {
    const cameraPos = camera.object3D.position;
    camera.object3D.position.set(cameraPos.x, 2.5, cameraPos.z);
  }

  camera.object3D.matrixNeedsUpdate = true;

  camera.removeAttribute("scene-preview-camera");
  camera.setAttribute("scene-preview-camera", "positionOnly: true; duration: 60");
}

let uiProps = {};

// Hub ID and slug are the basename
let routerBaseName = document.location.pathname.split("/").slice(0, 2).join("/");

if (document.location.pathname.includes("hub.html")) {
  routerBaseName = "/";
}

// when loading the client as a "default room" on the homepage, use MemoryHistory since exposing all the client paths at the root is undesirable
const history = routerBaseName === "/" ? createMemoryHistory() : createBrowserHistory({ basename: routerBaseName });
window.APP.history = history;

const qsVREntryType = qs.get("vr_entry_type");

function mountUI(props = {}) {
  const scene = document.querySelector("a-scene");
  const disableAutoExitOnIdle =
    qsTruthy("allow_idle") || (process.env.NODE_ENV === "development" && !qs.get("idle_timeout"));
  const forcedVREntryType = qsVREntryType;

  ReactDOM.render(
    <WrappedIntlProvider>
      <ThemeProvider store={store}>
        <Router history={history}>
          <Route
            render={routeProps =>
              props.showOAuthScreen ? (
                <OAuthScreenContainer oauthInfo={props.oauthInfo} />
              ) : props.roomUnavailableReason ? (
                <ExitedRoomScreenContainer reason={props.roomUnavailableReason} />
              ) : (
                <UIRoot
                  {...{
                    scene,
                    isBotMode,
                    disableAutoExitOnIdle,
                    forcedVREntryType,
                    store,
                    mediaSearchStore,
                    ...props,
                    ...routeProps
                  }}
                />
              )
            }
          />
        </Router>
      </ThemeProvider>
    </WrappedIntlProvider>,
    document.getElementById("ui-root")
  );
}

export function remountUI(props) {
  uiProps = { ...uiProps, ...props };
  mountUI(uiProps);
}

export async function getSceneUrlForHub(hub) {
  let sceneUrl;
  let isLegacyBundle; // Deprecated
  if (hub.scene) {
    isLegacyBundle = false;
    sceneUrl = hub.scene.model_url;
  } else if (hub.scene === null) {
    // delisted/removed scene
    sceneUrl = loadingEnvironment;
  } else {
    const defaultSpaceTopic = hub.topics[0];
    const glbAsset = defaultSpaceTopic.assets.find(a => a.asset_type === "glb");
    const bundleAsset = defaultSpaceTopic.assets.find(a => a.asset_type === "gltf_bundle");
    sceneUrl = (glbAsset || bundleAsset).src || loadingEnvironment;
    const hasExtension = /\.gltf/i.test(sceneUrl) || /\.glb/i.test(sceneUrl);
    isLegacyBundle = !(glbAsset || hasExtension);
  }

  if (qsTruthy("debugLocalScene") && sceneUrl?.startsWith("blob:")) {
    // we skip doing this if you haven't entered because refreshing the page will invalidate blob urls and break loading
    sceneUrl = document.querySelector("a-scene").is("entered") ? sceneUrl : loadingEnvironment;
  } else if (isLegacyBundle) {
    // Deprecated
    const res = await fetch(sceneUrl);
    const data = await res.json();
    const baseURL = new URL(THREE.LoaderUtils.extractUrlBase(sceneUrl), window.location.href);
    sceneUrl = new URL(data.assets[0].src, baseURL).href;
  } else {
    sceneUrl = proxiedUrlFor(sceneUrl);
  }
  return sceneUrl;
}

export async function updateEnvironmentForHub(hub, entryManager) {
  console.log("Updating environment for hub");
  const sceneUrl = await getSceneUrlForHub(hub);

  if (qsTruthy("newLoader")) {
    console.log("Using new loading path for scenes.");
    swapActiveScene(APP.world, sceneUrl);
    return;
  }

  const sceneErrorHandler = () => {
    remountUI({ roomUnavailableReason: ExitReason.sceneError });
    entryManager.exitScene();
  };

  const environmentScene = document.querySelector("#environment-scene");
  const sceneEl = document.querySelector("a-scene");

  const envSystem = sceneEl.systems["hubs-systems"].environmentSystem;

  console.log(`Scene URL: ${sceneUrl}`);
  const loadStart = performance.now();

  let environmentEl = null;

  if (environmentScene.childNodes.length === 0) {
    const environmentEl = document.createElement("a-entity");

    environmentEl.addEventListener(
      "model-loaded",
      () => {
        environmentEl.removeEventListener("model-error", sceneErrorHandler);

        console.log(`Scene file initial load took ${Math.round(performance.now() - loadStart)}ms`);

        // Show the canvas once the model has loaded
        document.querySelector(".a-canvas").classList.remove("a-hidden");

        sceneEl.addState("visible");

        envSystem.updateEnvironment(environmentEl);

        //TODO: check if the environment was made with spoke to determine if a shape should be added
        traverseMeshesAndAddShapes(environmentEl);
      },
      { once: true }
    );

    environmentEl.addEventListener("model-error", sceneErrorHandler, { once: true });

    environmentEl.setAttribute("gltf-model-plus", { src: sceneUrl, useCache: false, inflate: true });
    environmentScene.appendChild(environmentEl);
  } else {
    // Change environment
    environmentEl = environmentScene.childNodes[0];

    // Clear the three.js image cache and load the loading environment before switching to the new one.
    THREE.Cache.clear();
    const waypointSystem = sceneEl.systems["hubs-systems"].waypointSystem;
    waypointSystem.releaseAnyOccupiedWaypoints();

    environmentEl.addEventListener(
      "model-loaded",
      () => {
        environmentEl.addEventListener(
          "model-loaded",
          () => {
            environmentEl.removeEventListener("model-error", sceneErrorHandler);

            envSystem.updateEnvironment(environmentEl);

            console.log(`Scene file update load took ${Math.round(performance.now() - loadStart)}ms`);

            traverseMeshesAndAddShapes(environmentEl);

            // We've already entered, so move to new spawn point once new environment is loaded
            if (sceneEl.is("entered")) {
              waypointSystem.moveToSpawnPoint();
            }

            const fader = document.getElementById("viewing-camera").components["fader"];

            // Add a slight delay before de-in to reduce hitching.
            setTimeout(() => fader.fadeIn(), 2000);
          },
          { once: true }
        );

        sceneEl.emit("leaving_loading_environment");
        if (environmentEl.components["gltf-model-plus"].data.src === sceneUrl) {
          console.warn("Updating environment to the same url.");
          environmentEl.setAttribute("gltf-model-plus", { src: "" });
        }
        environmentEl.setAttribute("gltf-model-plus", { src: sceneUrl });
      },
      { once: true }
    );

    if (!sceneEl.is("entered")) {
      environmentEl.addEventListener("model-error", sceneErrorHandler, { once: true });
    }

    if (environmentEl.components["gltf-model-plus"].data.src === loadingEnvironment) {
      console.warn("Transitioning to loading environment but was already in loading environment.");
      environmentEl.setAttribute("gltf-model-plus", { src: "" });
    }
    environmentEl.setAttribute("gltf-model-plus", { src: loadingEnvironment });
  }
}

export async function updateUIForHub(hub, hubChannel) {
  remountUI({ hub, entryDisallowed: !hubChannel.canEnterRoom(hub) });
}

function onConnectionError(entryManager, connectError) {
  console.error("An error occurred while attempting to connect to networked scene:", connectError);
  // hacky until we get return codes
  const isFull = connectError.msg && connectError.msg.match(/\bfull\b/i);
  remountUI({ roomUnavailableReason: isFull ? ExitReason.full : ExitReason.connectError });
  entryManager.exitScene();
}

// TODO: Find a home for this
// TODO: Naming. Is this an "event bus"?
const events = emitter();
function handleHubChannelJoined(entryManager, hubChannel, messageDispatch, data) {
  const scene = document.querySelector("a-scene");
  const isRejoin = NAF.connection.isConnected();

  if (isRejoin) {
    // Slight hack, to ensure correct presence state we need to re-send the entry event
    // on re-join. Ideally this would be updated into the channel socket state but this
    // would require significant changes to the hub channel events and socket management.
    if (scene.is("entered")) {
      hubChannel.sendEnteredEvent();
    }

    // Send complete sync on phoenix re-join.
    // TODO: We should be able to safely remove this completeSync now that
    //       NAF occupancy is driven from phoenix presence state.
    NAF.connection.entities.completeSync(null, true);
    return;
  }

  // Turn off NAF for embeds as an optimization, so the user's browser isn't getting slammed
  // with NAF traffic on load.
  if (isEmbed) {
    hubChannel.allowNAFTraffic(false);
  }

  const hub = data.hubs[0];

  console.log(`Dialog host: ${hub.host}:${hub.port}`);

  remountUI({
    messageDispatch: messageDispatch,
    onSendMessage: messageDispatch.dispatch,
    onLoaded: () => store.executeOnLoadActions(scene),
    onMediaSearchResultEntrySelected: (entry, selectAction) =>
      scene.emit("action_selected_media_result_entry", { entry, selectAction }),
    onMediaSearchCancelled: entry => scene.emit("action_media_search_cancelled", entry),
    onAvatarSaved: entry => scene.emit("action_avatar_saved", entry)
  });

  scene.addEventListener("action_selected_media_result_entry", e => {
    const { entry, selectAction } = e.detail;
    if ((entry.type !== "scene_listing" && entry.type !== "scene") || selectAction !== "use") return;
    if (!hubChannel.can("update_hub")) return;

    hubChannel.updateScene(entry.url);
  });

  // Handle request for user gesture
  scene.addEventListener("2d-interstitial-gesture-required", () => {
    remountUI({
      showInterstitialPrompt: true,
      onInterstitialPromptClicked: () => {
        remountUI({ showInterstitialPrompt: false, onInterstitialPromptClicked: null });
        scene.emit("2d-interstitial-gesture-complete");
      }
    });
  });

  scene.addEventListener(
    "didConnectToNetworkedScene",
    () => {
      // Append objects once we are in the NAF room since ownership may be taken.
      const objectsScene = document.querySelector("#objects-scene");
      const objectsUrl = getReticulumFetchUrl(`/${hub.hub_id}/objects.gltf`);
      const objectsEl = document.createElement("a-entity");

      objectsEl.setAttribute("gltf-model-plus", { src: objectsUrl, useCache: false, inflate: true });

      if (!isBotMode) {
        objectsScene.appendChild(objectsEl);
      }
    },
    { once: true }
  );

  scene.setAttribute("networked-scene", {
    room: hub.hub_id,
    serverURL: `wss://${hub.host}:${hub.port}`, // TODO: This is confusing because this is the dialog host and port.
    debug: !!isDebug,
    adapter: "phoenix"
  });

  (async () => {
    while (!scene.components["networked-scene"] || !scene.components["networked-scene"].data) await nextTick();

    const loadEnvironmentAndConnect = () => {
      console.log("Loading environment and connecting to dialog servers");

      updateEnvironmentForHub(hub, entryManager);

      // Disconnect in case this is a re-entry
      APP.dialog.disconnect();
      APP.dialog.connect({
        serverUrl: `wss://${hub.host}:${hub.port}`,
        roomId: hub.hub_id,
        serverParams: { host: hub.host, port: hub.port, turn: hub.turn },
        scene,
        clientId: data.session_id,
        forceTcp: qs.get("force_tcp"),
        forceTurn: qs.get("force_turn"),
        iceTransportPolicy: qs.get("force_tcp") || qs.get("force_turn") ? "relay" : "all"
      });
      scene.addEventListener(
        "adapter-ready",
        ({ detail: adapter }) => {
          adapter.hubChannel = hubChannel;
          adapter.events = events;
          adapter.session_id = data.session_id;
        },
        { once: true }
      );
      scene.components["networked-scene"]
        .connect()
        .then(() => {
          scene.emit("didConnectToNetworkedScene");
        })
        .catch(connectError => {
          onConnectionError(entryManager, connectError);
        });
    };

    window.APP.hub = hub;
    updateUIForHub(hub, hubChannel);
    scene.emit("hub_updated", { hub });

    if (!isEmbed) {
      console.log("Page is not embedded so environment initialization will start immediately");
      loadEnvironmentAndConnect();
    } else {
      console.log("Page is embedded so environment initialization will be deferred");
      remountUI({
        onPreloadLoadClicked: () => {
          console.log("Preload has been activated");
          hubChannel.allowNAFTraffic(true);
          remountUI({ showPreload: false });
          loadEnvironmentAndConnect();
        }
      });
    }
  })();
}

async function runBotMode(scene, entryManager) {
  console.log("Running in bot mode...");
  const noop = () => {};
  const alwaysFalse = () => false;
  scene.renderer = {
    setAnimationLoop: noop,
    render: noop,
    shadowMap: {},
    vr: { isPresenting: alwaysFalse },
    setSize: noop
  };

  while (!NAF.connection.isConnected()) await nextTick();
  entryManager.enterSceneWhenLoaded(false, false);
}

document.addEventListener("DOMContentLoaded", async () => {
  if (isOAuthModal) {
    return;
  }

  await store.initProfile();

  const canvas = document.querySelector(".a-canvas");
  canvas.classList.add("a-hidden");

  if (platformUnsupported()) {
    return;
  }

  const detectedOS = detectOS(navigator.userAgent);
  const browser = detect();
  // HACK - it seems if we don't initialize the mic track up-front, voices can drop out on iOS
  // safari when initializing it later.
  if (["iOS", "Mac OS"].includes(detectedOS) && ["safari", "ios"].includes(browser.name)) {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      remountUI({ showSafariMicDialog: true });
      return;
    }
  }

  const hubId = getCurrentHubId();
  console.log(`Hub ID: ${hubId}`);

  const shouldRedirectToSignInPage =
    // Default room won't work if account is required to access
    !configs.feature("default_room_id") &&
    configs.feature("require_account_for_join") &&
    !(store.state.credentials && store.state.credentials.token);
  if (shouldRedirectToSignInPage) {
    document.location = `/?sign_in&sign_in_destination=hub&sign_in_destination_url=${encodeURIComponent(
      document.location.toString()
    )}`;
  }

  const subscriptions = new Subscriptions(hubId);
  APP.subscriptions = subscriptions;
  subscriptions.register();

  const scene = document.querySelector("a-scene");

  const onSceneLoaded = () => {
    const physicsSystem = scene.systems["hubs-systems"].physicsSystem;
    physicsSystem.setDebug(isDebug || physicsSystem.debug);
  };
  if (scene.hasLoaded) {
    onSceneLoaded();
  } else {
    scene.addEventListener("loaded", onSceneLoaded, { once: true });
  }

  // If the stored avatar doesn't have a valid src, reset to a legacy avatar.
  const avatarSrc = await getAvatarSrc(store.state.profile.avatarId);
  if (!avatarSrc) {
    await store.resetToRandomDefaultAvatar();
  }

  const authChannel = new AuthChannel(store);
  const hubChannel = new HubChannel(store, hubId);
  window.APP.hubChannel = hubChannel;

  const entryManager = new SceneEntryManager(hubChannel, authChannel, history);
  window.APP.entryManager = entryManager;

  APP.dialog.on(DIALOG_CONNECTION_CONNECTED, () => {
    scene.emit("didConnectToDialog");
  });
  APP.dialog.on(DIALOG_CONNECTION_ERROR_FATAL, () => {
    // TODO: Change the wording of the connect error to match dialog connection error
    // TODO: Tell the user that dialog is broken, but don't completely end the experience
    remountUI({ roomUnavailableReason: ExitReason.connectError });
    APP.entryManager.exitScene();
  });

  const audioSystem = scene.systems["hubs-systems"].audioSystem;
  APP.mediaDevicesManager = new MediaDevicesManager(scene, store, audioSystem);

  const performConditionalSignIn = async (predicate, action, signInMessage, onFailure) => {
    if (predicate()) return action();

    await handleExitTo2DInterstitial(true, () => remountUI({ showSignInDialog: false }));

    remountUI({
      showSignInDialog: true,
      signInMessage,
      onContinueAfterSignIn: async () => {
        remountUI({ showSignInDialog: false, onContinueAfterSignIn: null });
        let actionError = null;
        if (predicate()) {
          try {
            await action();
          } catch (e) {
            actionError = e;
          }
        } else {
          actionError = new Error("Predicate failed post sign-in");
        }

        if (actionError && onFailure) onFailure(actionError);
        exit2DInterstitialAndEnterVR();
      }
    });
  };

  window.APP.pinningHelper = new PinningHelper(hubChannel, authChannel, store, performConditionalSignIn);

  window.addEventListener("action_create_avatar", () => {
    performConditionalSignIn(
      () => hubChannel.signedIn,
      () => pushHistoryState(history, "overlay", "avatar-editor"),
      SignInMessages.createAvatar
    );
  });

  scene.addEventListener("scene_media_selected", e => {
    const sceneInfo = e.detail;

    performConditionalSignIn(
      () => hubChannel.can("update_hub"),
      () => hubChannel.updateScene(sceneInfo),
      SignInMessages.changeScene
    );
  });

  remountUI({
    performConditionalSignIn,
    embed: isEmbed,
    showPreload: isEmbed
  });
  entryManager.performConditionalSignIn = performConditionalSignIn;
  entryManager.init();

  const linkChannel = new LinkChannel(store);
  window.dispatchEvent(new CustomEvent("hub_channel_ready"));

  const handleEarlyVRMode = () => {
    // If VR headset is activated, refreshing page will fire vrdisplayactivate
    // which puts A-Frame in VR mode, so exit VR mode whenever it is attempted
    // to be entered and we haven't entered the room yet.
    if (scene.is("vr-mode") && !scene.is("vr-entered") && !isMobileVR) {
      console.log("Pre-emptively exiting VR mode.");
      scene.exitVR();
      return true;
    }

    return false;
  };
  remountUI({ availableVREntryTypes: ONLY_SCREEN_AVAILABLE, checkingForDeviceAvailability: true });
  const availableVREntryTypesPromise = getAvailableVREntryTypes();
  scene.addEventListener("enter-vr", () => {
    if (handleEarlyVRMode()) return true;

    if (isMobileVR) {
      // Optimization, stop drawing UI if not visible
      remountUI({ hide: true });
    }

    document.body.classList.add("vr-mode");

    availableVREntryTypesPromise.then(availableVREntryTypes => {
      // Don't stretch canvas on cardboard, since that's drawing the actual VR view :)
      if ((!isMobile && !isMobileVR) || availableVREntryTypes.cardboard !== VR_DEVICE_AVAILABILITY.yes) {
        document.body.classList.add("vr-mode-stretch");
      }
    });
  });
  handleEarlyVRMode();

  // HACK A-Frame 0.9.0 seems to fail to wire up vrdisplaypresentchange early enough
  // to catch presentation state changes and recognize that an HMD is presenting on startup.
  window.addEventListener(
    "vrdisplaypresentchange",
    () => {
      if (scene.is("vr-entered")) return;
      if (scene.is("vr-mode")) return;

      const device = AFRAME.utils.device.getVRDisplay();

      if (device && device.isPresenting) {
        if (!scene.is("vr-mode")) {
          console.warn("Hit A-Frame bug where VR display is presenting but A-Frame has not entered VR mode.");
          scene.enterVR();
        }
      }
    },
    { once: true }
  );

  scene.addEventListener("exit-vr", () => {
    document.body.classList.remove("vr-mode");
    document.body.classList.remove("vr-mode-stretch");

    remountUI({ hide: false });

    // HACK: Oculus browser pauses videos when exiting VR mode, so we need to resume them after a timeout.
    if (/OculusBrowser/i.test(window.navigator.userAgent)) {
      document.querySelectorAll("[media-video]").forEach(m => {
        const videoComponent = m.components["media-video"];

        if (videoComponent) {
          videoComponent._ignorePauseStateChanges = true;

          setTimeout(() => {
            const video = videoComponent.video;

            if (video && video.paused && !videoComponent.data.videoPaused) {
              video.play();
            }

            videoComponent._ignorePauseStateChanges = false;
          }, 1000);
        }
      });
    }
  });

  registerNetworkSchemas();

  remountUI({
    authChannel,
    hubChannel,
    linkChannel,
    subscriptions,
    enterScene: entryManager.enterScene,
    exitScene: reason => {
      entryManager.exitScene();
      remountUI({ roomUnavailableReason: reason || ExitReason.exited });
    }
  });

  scene.addEventListener("leave_room_requested", () => {
    entryManager.exitScene();
    remountUI({ roomUnavailableReason: ExitReason.left });
  });

  scene.addEventListener("hub_closed", () => {
    scene.exitVR();
    entryManager.exitScene();
    remountUI({ roomUnavailableReason: ExitReason.closed });
  });

  scene.addEventListener("action_camera_recording_started", () => hubChannel.beginRecording());
  scene.addEventListener("action_camera_recording_ended", () => hubChannel.endRecording());

  if (qs.get("required_version") && process.env.BUILD_VERSION) {
    const buildNumber = process.env.BUILD_VERSION.split(" ", 1)[0]; // e.g. "123 (abcd5678)"

    if (qs.get("required_version") !== buildNumber) {
      remountUI({ roomUnavailableReason: ExitReason.versionMismatch });
      setTimeout(() => document.location.reload(), 5000);
      entryManager.exitScene();
      return;
    }
  }

  getReticulumMeta().then(reticulumMeta => {
    console.log(`Reticulum @ ${reticulumMeta.phx_host}: v${reticulumMeta.version} on ${reticulumMeta.pool}`);

    if (
      qs.get("required_ret_version") &&
      (qs.get("required_ret_version") !== reticulumMeta.version || qs.get("required_ret_pool") !== reticulumMeta.pool)
    ) {
      remountUI({ roomUnavailableReason: ExitReason.versionMismatch });
      setTimeout(() => document.location.reload(), 5000);
      entryManager.exitScene();
      return;
    }
  });

  availableVREntryTypesPromise.then(async availableVREntryTypes => {
    if (isMobileVR) {
      remountUI({
        availableVREntryTypes,
        forcedVREntryType: qsVREntryType || "vr",
        checkingForDeviceAvailability: false
      });

      if (/Oculus/.test(navigator.userAgent) && "getVRDisplays" in navigator) {
        // HACK - The polyfill reports Cardboard as the primary VR display on startup out ahead of
        // Oculus Go on Oculus Browser 5.5.0 beta. This display is cached by A-Frame,
        // so we need to resolve that and get the real VRDisplay before entering as well.
        const displays = await navigator.getVRDisplays();
        const vrDisplay = displays.length && displays[0];
        AFRAME.utils.device.getVRDisplay = () => vrDisplay;
      }
    } else {
      const hasVREntryDevice =
        availableVREntryTypes.cardboard !== VR_DEVICE_AVAILABILITY.no ||
        availableVREntryTypes.generic !== VR_DEVICE_AVAILABILITY.no ||
        availableVREntryTypes.daydream !== VR_DEVICE_AVAILABILITY.no;

      remountUI({
        availableVREntryTypes,
        forcedVREntryType: qsVREntryType || (!hasVREntryDevice ? "2d" : null),
        checkingForDeviceAvailability: false
      });
    }
  });

  const environmentScene = document.querySelector("#environment-scene");
  environmentScene.addEventListener(
    "model-loaded",
    () => {
      // Replace renderer with a noop renderer to reduce bot resource usage.
      if (isBotMode) {
        runBotMode(scene, entryManager);
      }
    },
    { once: true }
  );

  environmentScene.addEventListener("model-loaded", ({ detail: { model } }) => {
    console.log("Environment scene has loaded");

    if (!scene.is("entered")) {
      setupLobbyCamera();
    }

    // This will be run every time the environment is changed (including the first load.)
    remountUI({ environmentSceneLoaded: true });
    scene.emit("environment-scene-loaded", model);

    for (const modelEl of environmentScene.children) {
      addAnimationComponents(modelEl);
    }
  });

  // Socket disconnects on refresh but we don't want to show exit scene in that scenario.
  let isReloading = false;
  window.addEventListener("beforeunload", () => (isReloading = true));

  const socket = await connectToReticulum(isDebug);

  socket.onClose(e => {
    // We don't currently have an easy way to distinguish between being kicked (server closes socket)
    // and a variety of other network issues that seem to produce the 1000 closure code, but the
    // latter are probably more common. Either way, we just tell the user they got disconnected.
    const NORMAL_CLOSURE = 1000;

    if (e.code === NORMAL_CLOSURE && !isReloading) {
      entryManager.exitScene();
      remountUI({ roomUnavailableReason: ExitReason.disconnected });
    }
  });

  // Reticulum global channel
  APP.retChannel = socket.channel(`ret`, { hub_id: hubId });
  APP.retChannel
    .join()
    .receive("ok", data => {
      subscriptions.setVapidPublicKey(data.vapid_public_key);
    })
    .receive("error", res => {
      subscriptions.setVapidPublicKey(null);
      console.error(res);
    });

  const pushSubscriptionEndpoint = await subscriptions.getCurrentEndpoint();

  APP.hubChannelParamsForPermsToken = permsToken => {
    return createHubChannelParams({
      profile: store.state.profile,
      pushSubscriptionEndpoint,
      permsToken,
      isMobile,
      isMobileVR,
      isEmbed,
      hubInviteId: qs.get("hub_invite_id"),
      authToken: store.state.credentials && store.state.credentials.token
    });
  };

  const migrateToNewReticulumServer = async ({ ret_version, ret_pool }, shouldAbandonMigration) => {
    console.log(`[reconnect] Reticulum deploy detected v${ret_version} on ${ret_pool}.`);

    const didMatchMeta = await tryGetMatchingMeta({ ret_version, ret_pool }, shouldAbandonMigration);
    if (!didMatchMeta) {
      console.error(`[reconnect] Failed to reconnect. Did not get meta for v${ret_version} on ${ret_pool}.`);
      return;
    }

    console.log("[reconnect] Reconnect in progress. Updated reticulum meta.");
    const oldSocket = APP.retChannel.socket;
    const socket = await connectToReticulum(isDebug, oldSocket.params());
    APP.retChannel = await migrateChannelToSocket(APP.retChannel, socket);
    await hubChannel.migrateToSocket(socket, APP.hubChannelParamsForPermsToken());
    authChannel.setSocket(socket);
    linkChannel.setSocket(socket);

    // Disconnect old socket after a delay to ensure this user is always registered in presence.
    await sleep(10000);
    oldSocket.teardown();
    console.log("[reconnect] Reconnection successful.");
  };

  const onRetDeploy = (function () {
    let pendingNotification = null;
    const hasPendingNotification = function () {
      return !!pendingNotification;
    };

    const handleNextMessage = (function () {
      let isLocked = false;
      return async function handleNextMessage() {
        if (isLocked || !pendingNotification) return;

        isLocked = true;
        const currentNotification = Object.assign({}, pendingNotification);
        pendingNotification = null;
        try {
          await migrateToNewReticulumServer(currentNotification, hasPendingNotification);
        } catch {
          console.error("Failed to migrate to new reticulum server after deploy.", currentNotification);
        } finally {
          isLocked = false;
          handleNextMessage();
        }
      };
    })();

    return function onRetDeploy(deployNotification) {
      // If for some reason we receive multiple deployNotifications, only the
      // most recent one matters. The rest can be overwritten.
      pendingNotification = deployNotification;
      handleNextMessage();
    };
  })();

  APP.retChannel.on("notice", data => {
    if (data.event === "ret-deploy") {
      onRetDeploy(data);
    }
  });

  const messageDispatch = new MessageDispatch(scene, entryManager, hubChannel, remountUI, mediaSearchStore);
  APP.messageDispatch = messageDispatch;
  document.getElementById("avatar-rig").messageDispatch = messageDispatch;

  const oauthFlowPermsToken = Cookies.get(OAUTH_FLOW_PERMS_TOKEN_KEY);
  if (oauthFlowPermsToken) {
    Cookies.remove(OAUTH_FLOW_PERMS_TOKEN_KEY);
  }
  const hubPhxChannel = socket.channel(`hub:${hubId}`, APP.hubChannelParamsForPermsToken(oauthFlowPermsToken));
  hubChannel.channel = hubPhxChannel;
  hubChannel.presence = new Presence(hubPhxChannel);
  const { rawOnJoin, rawOnLeave } = denoisePresence(presenceEventsForHub(events));
  hubChannel.presence.onJoin(rawOnJoin);
  hubChannel.presence.onLeave(rawOnLeave);
  hubChannel.presence.onSync(() => {
    events.trigger(`hub:sync`, { presence: hubChannel.presence });
  });

  events.on(`hub:join`, ({ key, meta }) => {
    scene.emit("presence_updated", {
      sessionId: key,
      profile: meta.profile,
      roles: meta.roles,
      permissions: meta.permissions,
      streaming: meta.streaming,
      recording: meta.recording,
      hand_raised: meta.hand_raised,
      typing: meta.typing
    });
  });
  events.on(`hub:join`, ({ key, meta }) => {
    if (
      APP.hideHubPresenceEvents ||
      key === hubChannel.channel.socket.params().session_id ||
      hubChannel.presence.list().length > NOISY_OCCUPANT_COUNT
    ) {
      return;
    }
    messageDispatch.receive({
      type: "join",
      presence: meta.presence,
      name: meta.profile.displayName
    });
  });

  events.on(`hub:leave`, ({ meta }) => {
    if (APP.hideHubPresenceEvents || hubChannel.presence.list().length > NOISY_OCCUPANT_COUNT) {
      return;
    }
    messageDispatch.receive({
      type: "leave",
      name: meta.profile.displayName
    });
  });

  events.on(`hub:change`, ({ key, previous, current }) => {
    if (
      previous.presence === current.presence ||
      current.presence !== "room" ||
      key === hubChannel.channel.socket.params().session_id
    ) {
      return;
    }

    messageDispatch.receive({
      type: "entered",
      presence: current.presence,
      name: current.profile.displayName
    });
  });
  events.on(`hub:change`, ({ previous, current }) => {
    if (previous.profile.displayName !== current.profile.displayName) {
      messageDispatch.receive({
        type: "display_name_changed",
        oldName: previous.profile.displayName,
        newName: current.profile.displayName
      });
    }
  });
  events.on(`hub:change`, ({ key, previous, current }) => {
    if (
      key === hubChannel.channel.socket.params().session_id &&
      previous.profile.avatarId !== current.profile.avatarId
    ) {
      messageDispatch.log(LogMessageType.avatarChanged);
    }
  });
  events.on(`hub:change`, ({ key, current }) => {
    scene.emit("presence_updated", {
      sessionId: key,
      profile: current.profile,
      roles: current.roles,
      permissions: current.permissions,
      streaming: current.streaming,
      recording: current.recording,
      hand_raised: current.hand_raised,
      typing: current.typing
    });
  });

  // We need to be able to wait for initial presence syncs across reconnects and socket migrations,
  // so we create this object in the outer scope and assign it a new promise on channel join.
  const presenceSync = {
    promise: null,
    resolve: null
  };
  events.on("hub:sync", () => {
    presenceSync.resolve();
  });
  events.on(`hub:sync`, () => {
    APP.hideHubPresenceEvents = false;
  });
  events.on(`hub:sync`, updateVRHudPresenceCount);
  events.on(`hub:sync`, ({ presence }) => {
    updateSceneCopresentState(presence, scene);
  });
  events.on(`hub:sync`, ({ presence }) => {
    remountUI({
      sessionId: socket.params().session_id,
      presences: presence.state,
      entryDisallowed: !hubChannel.canEnterRoom(uiProps.hub)
    });
  });

  listenForNetworkMessages(hubPhxChannel, events);
  hubPhxChannel
    .join()
    .receive("ok", async data => {
      setLocalClientID(data.session_id);
      APP.hideHubPresenceEvents = true;
      presenceSync.promise = new Promise(resolve => {
        presenceSync.resolve = resolve;
      });

      socket.params().session_id = data.session_id;
      socket.params().session_token = data.session_token;

      const permsToken = oauthFlowPermsToken || data.perms_token;
      hubChannel.setPermissionsFromToken(permsToken);

      subscriptions.setHubChannel(hubChannel);
      subscriptions.setSubscribed(data.subscriptions.web_push);

      remountUI({
        hubIsBound: data.hub_requires_oauth,
        initialIsFavorited: data.subscriptions.favorites
      });

      await presenceSync.promise;
      handleHubChannelJoined(entryManager, hubChannel, messageDispatch, data);
    })
    .receive("error", res => {
      if (res.reason === "closed") {
        entryManager.exitScene();
        remountUI({ roomUnavailableReason: ExitReason.closed });
      } else if (res.reason === "oauth_required") {
        entryManager.exitScene();
        remountUI({ oauthInfo: res.oauth_info, showOAuthScreen: true });
      } else if (res.reason === "join_denied") {
        entryManager.exitScene();
        remountUI({ roomUnavailableReason: ExitReason.denied });
      }

      console.error(res);
    });

  hubPhxChannel.on("message", ({ session_id, type, body, from }) => {
    const getAuthor = () => {
      const userInfo = hubChannel.presence.state[session_id];
      if (from) {
        return from;
      } else if (userInfo) {
        return userInfo.metas[0].profile.displayName;
      } else {
        return "Mystery user";
      }
    };

    const name = getAuthor();
    const maySpawn = scene.is("entered");

    const incomingMessage = {
      name,
      type,
      body,
      maySpawn,
      sessionId: session_id,
      sent: session_id === socket.params().session_id
    };

    if (scene.is("vr-mode")) {
      createInWorldLogMessage(incomingMessage);
    }

    messageDispatch.receive(incomingMessage);
  });

  hubPhxChannel.on("hub_refresh", ({ session_id, hubs, stale_fields }) => {
    const hub = hubs[0];
    const userInfo = hubChannel.presence.state[session_id];
    const displayName = (userInfo && userInfo.metas[0].profile.displayName) || "API";

    window.APP.hub = hub;
    updateUIForHub(hub, hubChannel);

    if (
      stale_fields.includes("scene") ||
      stale_fields.includes("scene_listing") ||
      stale_fields.includes("default_environment_gltf_bundle_url")
    ) {
      const fader = document.getElementById("viewing-camera").components["fader"];

      fader.fadeOut().then(() => {
        scene.emit("reset_scene");
        updateEnvironmentForHub(hub, entryManager);
      });

      messageDispatch.receive({
        type: "scene_changed",
        name: displayName,
        sceneName: hub.scene ? hub.scene.name : "a custom URL"
      });
    }

    if (stale_fields.includes("member_permissions")) {
      hubChannel.fetchPermissions();
    }

    if (stale_fields.includes("name")) {
      const titleParts = document.title.split(" | "); // Assumes title has | trailing site name
      titleParts[0] = hub.name;
      document.title = titleParts.join(" | ");

      // Re-write the slug in the browser history
      const pathParts = history.location.pathname.split("/");
      const oldSlug = pathParts[1];
      const { search, state } = history.location;
      const pathname = history.location.pathname.replace(`/${oldSlug}`, `/${hub.slug}`);

      history.replace({ pathname, search, state });

      messageDispatch.receive({
        type: "hub_name_changed",
        name: displayName,
        hubName: hub.name
      });
    }

    if (hub.entry_mode === "deny") {
      scene.emit("hub_closed");
    }

    scene.emit("hub_updated", { hub });
  });

  hubPhxChannel.on("permissions_updated", () => hubChannel.fetchPermissions());

  hubPhxChannel.on("mute", ({ session_id }) => {
    if (session_id === NAF.clientId) {
      APP.mediaDevicesManager.micEnabled = false;
    }
  });

  authChannel.setSocket(socket);
  linkChannel.setSocket(socket);
});
