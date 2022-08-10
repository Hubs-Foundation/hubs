import { createNetworkedEntity } from "../systems/netcode.js";
import { parseURL } from "../utils/media-utils";

async function maybeSpawnPastedURL(e) {
  if (!AFRAME.scenes[0].is("entered")) {
    return;
  }

  const isPastedInChat =
    (e.target.matches("input, textarea") || e.target.contentEditable === "true") && document.activeElement === e.target;
  if (isPastedInChat) {
    return;
  }

  const text = e.clipboardData.getData("text");
  if (!text) {
    return;
  }

  if (!parseURL(text)) {
    console.warn(`Could not parse URL. Ignoring pasted text:\n${text}`);
    return;
  }

  const eid = createNetworkedEntity(APP.world, "media", { src: text, recenter: true, resize: true });
  const avatarPov = document.querySelector("#avatar-pov-node").object3D;
  const obj = APP.world.eid2obj.get(eid);
  obj.position.copy(avatarPov.localToWorld(new THREE.Vector3(0, 0, -1.5)));
  obj.lookAt(avatarPov.getWorldPosition(new THREE.Vector3()));
}

function maybeSpawnPastedFiles(e) {
  if (!AFRAME.scenes[0].is("entered")) {
    return;
  }

  const isPastedInChat =
    (e.target.matches("input, textarea") || e.target.contentEditable === "true") && document.activeElement === e.target;
  if (isPastedInChat) {
    return;
  }

  // const files = e.clipboardData.files && e.clipboardData.files;
  // for (const file of files) {
  //   spawnMediaInfrontOfPlayer(file, ObjectContentOrigins.CLIPBOARD);
  // }
}

document.addEventListener("paste", maybeSpawnPastedURL);
document.addEventListener("paste", maybeSpawnPastedFiles);
