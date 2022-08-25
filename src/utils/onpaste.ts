import { createNetworkedEntity } from "../systems/netcode.js";
import { upload, parseURL } from "../utils/media-utils";
import { guessContentType, proxiedUrlFor } from "../utils/media-url-utils";
import { AElement } from "aframe";
import { Vector3 } from "three";

type UploadResponse = {
  file_id: string;
  meta: {
    access_token: string;
    expected_content_type: string; // TODO  one of valid mime types ("image/jpeg" etc)
    promotion_token: string;
  };
  origin: string;
};

async function maybeSpawnObjectsFromClipboard(e: ClipboardEvent) {
  if (!(AFRAME as any).scenes[0].is("entered")) {
    return;
  }

  const isPastedInChat =
    ((e.target! as Element).matches("input, textarea") || (e.target! as HTMLElement).contentEditable === "true") &&
    document.activeElement === e.target;
  if (isPastedInChat) {
    return;
  }

  if (!e.clipboardData) {
    return;
  }

  if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length) {
    for (const file of e.clipboardData.files) {
      const desiredContentType = file.type || guessContentType(file.name);
      const params = await upload(file, desiredContentType)
        .then(function (response: UploadResponse) {
          const srcUrl = new URL(response.origin);
          srcUrl.searchParams.set("token", response.meta.access_token);
          window.APP.store.update({
            uploadPromotionTokens: [{ fileId: response.file_id, promotionToken: response.meta.promotion_token }]
          });
          return {
            src: srcUrl.href,
            recenter: true,
            resize: true
          };
        })
        .catch(e => {
          console.error("Media upload failed", e);
          return {
            src: "error",
            recenter: true,
            resize: true
          };
        });

      const eid = createNetworkedEntity(APP.world, "media", params);
      const avatarPov = (document.querySelector("#avatar-pov-node")! as AElement).object3D;
      const obj = APP.world.eid2obj.get(eid)!;
      obj.position.copy(avatarPov.localToWorld(new Vector3(0, 0, -1.5)));
      obj.lookAt(avatarPov.getWorldPosition(new Vector3()));
    }
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
  const avatarPov = (document.querySelector("#avatar-pov-node")! as AElement).object3D;
  const obj = APP.world.eid2obj.get(eid)!;
  obj.position.copy(avatarPov.localToWorld(new Vector3(0, 0, -1.5)));
  obj.lookAt(avatarPov.getWorldPosition(new Vector3()));
}

document.addEventListener("paste", maybeSpawnObjectsFromClipboard);
