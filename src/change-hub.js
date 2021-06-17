import { getReticulumFetchUrl, hubUrl } from "./utils/phoenix-utils";
import { updateEnvironmentForHub, getSceneUrlForHub, updateUIForHub, remountUI } from "./hub";

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

export async function changeHub(hubId, addToHistory = true) {
  const scene = AFRAME.scenes[0];

  const data = await APP.hubChannel.migrateToChannel(makeChannel(hubId));
  const hub = data.hubs[0];

  if (addToHistory) {
    window.history.pushState(null, null, hubUrl(hubId, {}, hub.slug));
  }

  window.APP.hub = hub;
  updateUIForHub(hub, APP.hubChannel);
  scene.emit("hub_updated", { hub });

  APP.subscriptions.setSubscribed(data.subscriptions.web_push);

  remountUI({
    hubIsBound: data.hub_requires_oauth,
    initialIsFavorited: data.subscriptions.favorites
  });

  await APP.mediaDevicesManager.stopMicShare();
  NAF.entities.removeRemoteEntities();
  await NAF.connection.adapter.disconnect();
  unloadRoomObjects();
  NAF.connection.connectedClients = {};
  NAF.connection.activeDataChannels = {};

  NAF.room = hub.hub_id;
  NAF.connection.adapter.setServerUrl(`wss://${hub.host}:${hub.port}`);
  NAF.connection.adapter.setRoom(hub.hub_id);
  // TODO does this need to look at oauth token? It isnt in prod
  NAF.connection.adapter.setJoinToken(data.perms_token);
  NAF.connection.adapter.setServerParams(await window.APP.hubChannel.getHost());

  if (
    document.querySelector("#environment-scene").childNodes[0].components["gltf-model-plus"].data.src !==
    (await getSceneUrlForHub(hub))
  ) {
    const fader = document.getElementById("viewing-camera").components["fader"];
    fader.fadeOut().then(() => {
      updateEnvironmentForHub(hub, APP.entryManager);
    });
  }

  NAF.connection.adapter.connect().then(async function() {
    APP.mediaDevicesManager.startMicShare();
    loadRoomObjects(hubId);

    APP.hubChannel.sendEnteredEvent();
  });
}
window.changeHub = changeHub;
