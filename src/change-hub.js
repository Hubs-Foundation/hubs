import { getReticulumFetchUrl, hubUrl } from "./utils/phoenix-utils";
import { updateEnvironmentForHub, getSceneUrlForHub, updateUIForHub, remountUI } from "./hub";
import { loadLegacyRoomObjects } from "./utils/load-legacy-room-objects";
import { loadSavedEntityStates } from "./utils/entity-state-utils";
import { localClientID, pendingMessages, pendingParts } from "./bit-systems/networking";
import { storedUpdates } from "./bit-systems/network-receive-system";
import { shouldUseNewLoader } from "./utils/bit-utils";

function unloadRoomObjects() {
  document.querySelectorAll("[pinnable]").forEach(el => {
    if (el.components.pinnable.data.pinned) {
      el.parentNode.removeChild(el);
    }
  });

  // Clean up empty object.gltf nodes
  document.querySelectorAll("#objects-scene .Room_Objects").forEach(el => {
    if (!el.children.length) {
      el.parentNode.parentNode.removeChild(el.parentNode);
    }
  });
}

function loadRoomObjects(hubId) {
  const objectsScene = document.querySelector("#objects-scene");
  const objectsUrl = getReticulumFetchUrl(`/${hubId}/objects.gltf`);
  const objectsEl = document.createElement("a-entity");
  objectsEl.setAttribute("gltf-model-plus", { src: objectsUrl, useCache: false, inflate: true });
  objectsScene.appendChild(objectsEl);
}

export async function changeHub(hubId, addToHistory = true, waypoint = "") {
  if (hubId === APP.hub.hub_id) {
    console.log("Change hub called with the current hub id. This is a noop.");
    return;
  }

  // Suppress on-screen join and leave messages until we receive a sync.
  APP.hideHubPresenceEvents = true;
  const scene = AFRAME.scenes[0];

  // Generate leave events for everyone in the room.
  Object.keys(APP.hubChannel.presence.state).forEach(key => {
    const clientId = APP.getSid(key);
    if (clientId !== localClientID) {
      pendingParts.push(clientId);
    }
  });
  // Reticulum "leaving" causes pinned objects to get cleaned up.
  pendingParts.push(APP.getSid("reticulum"));

  let data;
  try {
    // TODO Migrating to a new hub in one step makes state cleanup suspicious.
    //      Would prefer to disconnect, cleanup state, then connect to the new hub.
    data = await APP.hubChannel.migrateToHub(hubId);
  } catch (e) {
    console.warn(`Failed to join hub ${hubId}: ${e.reason}|${e.message}`);
    APP.messageDispatch.log("joinFailed", { message: e.message });
    return;
  }

  const hub = data.hubs[0];

  if (addToHistory) {
    const search = new URLSearchParams(location.search);
    const params = {};
    for (const [key, value] of search.entries()) {
      if (key !== "hub_id") {
        params[key] = value;
      }
    }
    window.history.pushState(null, null, hubUrl(hubId, params, hub.slug, waypoint));
  }

  APP.hub = hub;
  updateUIForHub(hub, APP.hubChannel);
  scene.emit("hub_updated", { hub });

  APP.subscriptions.setSubscribed(data.subscriptions.web_push);

  remountUI({
    hubIsBound: data.hub_requires_oauth,
    initialIsFavorited: data.subscriptions.favorites
  });

  NAF.entities.removeRemoteEntities();
  await NAF.connection.adapter.disconnect();
  APP.dialog.disconnect();
  if (!shouldUseNewLoader()) {
    unloadRoomObjects();
  }
  NAF.connection.connectedClients = {};
  NAF.connection.activeDataChannels = {};
  if (pendingMessages.length || storedUpdates.size) {
    console.log(
      `Deleting ${pendingMessages.length + storedUpdates.size} unapplied network messages from previous hub.`
    );
    pendingMessages.length = 0;
    storedUpdates.clear();
  }

  NAF.room = hub.hub_id;

  if (
    // TODO: With newLoader (and new net code), we need to clear any network state
    // that we applied to scene-owned entities before transitioning to the new room.
    // For now, just unload scene even if the room we're going to has the same scene.
    shouldUseNewLoader() ||
    document.querySelector("#environment-scene").childNodes[0].components["gltf-model-plus"].data.src !==
      (await getSceneUrlForHub(hub))
  ) {
    const fader = document.getElementById("viewing-camera").components["fader"];
    fader.fadeOut().then(() => {
      scene.emit("reset_scene");
      updateEnvironmentForHub(hub, APP.entryManager);
    });
  }

  APP.retChannel.push("change_hub", { hub_id: hub.hub_id });

  await Promise.all([
    APP.dialog.connect({
      serverUrl: `wss://${hub.host}:${hub.port}`,
      roomId: hub.hub_id,
      serverParams: { host: hub.host, port: hub.port, turn: hub.turn },
      scene,
      clientId: APP.dialog._clientId,
      forceTcp: APP.dialog._forceTcp,
      forceTurn: APP.dialog._forceTurn,
      iceTransportPolicy: APP.dialog._iceTransportPolicy
    }),

    NAF.connection.adapter.connect()
  ]);

  if (shouldUseNewLoader()) {
    loadSavedEntityStates(APP.hubChannel);
    loadLegacyRoomObjects(hubId);
  } else {
    loadRoomObjects(hubId);
  }

  APP.hubChannel.sendEnteredEvent();

  APP.messageDispatch.receive({
    type: "hub_changed",
    hubName: hub.name,
    showLineBreak: true
  });
}
window.changeHub = changeHub;

// TODO see if there is a better way to do this with react router
window.addEventListener("popstate", function () {
  const qs = new URLSearchParams(location.search);
  const newHubId = qs.get("hub_id") || document.location.pathname.substring(1).split("/")[0];
  if (newHubId !== APP.hub.hub_id) {
    changeHub(newHubId, false);
  }
});
