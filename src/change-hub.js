import { getReticulumFetchUrl } from "./utils/phoenix-utils";
import { updateEnvironmentForHub, getSceneUrlForHub } from "./hub";

function unloadRoomObjects() {
  const objectsScene = document.querySelector("#objects-scene");
  objectsScene.removeChild(objectsScene.firstChild);
}

function loadRoomObjects(hubId) {
  const objectsScene = document.querySelector("#objects-scene");
  const objectsUrl = getReticulumFetchUrl(`/${hubId}/objects.gltf`);
  const objectsEl = document.createElement("a-entity");
  objectsEl.setAttribute("gltf-model-plus", { src: objectsUrl, useCache: false, inflate: true });
  objectsScene.appendChild(objectsEl);
}

export async function changeHub(hubId) {
  const data = await APP.hubChannel.migrateToChannel(makeChannel(hubId));
  const hub = data.hubs[0];
  APP.hubChannel.hubId = hub.hub_id;
  const scene = AFRAME.scenes[0];
  await APP.mediaDevicesManager.stopMicShare();
  await NAF.connection.disconnect();
  scene.setAttribute("networked-scene", {
    room: hub.hub_id,
    serverURL: `wss://${hub.host}:${hub.port}`
  });

  if (
    document.querySelector("#environment-scene").childNodes[0].components["gltf-model-plus"].data.src !==
    (await getSceneUrlForHub(hub))
  ) {
    const fader = document.getElementById("viewing-camera").components["fader"];
    fader.fadeOut().then(() => {
      updateEnvironmentForHub(hub, APP.entryManager);
    });
  }

  return AFRAME.scenes[0].components["networked-scene"].connect().then(async function() {
    APP.mediaDevicesManager.startMicShare();
    unloadRoomObjects();
    loadRoomObjects(hubId);

    APP.hubChannel.sendEnteredEvent();
  });
}
window.changeHub = changeHub;
