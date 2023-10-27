import { createNetworkedMedia } from "./utils/create-networked-entity";
import { upload, parseURL } from "./utils/media-utils";
import { guessContentType } from "./utils/media-url-utils";
import { AElement } from "aframe";
import { Vector3 } from "three";
import qsTruthy from "./utils/qs_truthy";
import { shouldUseNewLoader } from "./utils/bit-utils";

type UploadResponse = {
  file_id: string;
  meta: {
    access_token: string;
    expected_content_type: string; // TODO  one of valid mime types ("image/jpeg" etc)
    promotion_token: string;
  };
  origin: string;
};

export function spawnFromUrl(text: string) {
  if (!text) {
    return;
  }
  if (!parseURL(text)) {
    console.warn(`Could not parse URL. Ignoring pasted text:\n${text}`);
    return;
  }
  const eid = createNetworkedMedia(APP.world, {
    src: text,
    recenter: true,
    resize: !qsTruthy("noResize"),
    animateLoad: true,
    isObjectMenuTarget: true
  });
  const avatarPov = (document.querySelector("#avatar-pov-node")! as AElement).object3D;
  const obj = APP.world.eid2obj.get(eid)!;
  obj.position.copy(avatarPov.localToWorld(new Vector3(0, 0, -1.5)));
  obj.lookAt(avatarPov.getWorldPosition(new Vector3()));
}

export async function spawnFromFileList(files: FileList) {
  for (const file of files) {
    const desiredContentType = file.type || guessContentType(file.name);
    const params = await upload(file, desiredContentType)
      .then(function (response: UploadResponse) {
        const srcUrl = new URL(response.origin);
        srcUrl.searchParams.set("token", response.meta.access_token);
        return {
          src: srcUrl.href,
          recenter: true,
          resize: !qsTruthy("noResize"),
          animateLoad: true,
          fileId: response.file_id,
          isObjectMenuTarget: true
        };
      })
      .catch(e => {
        console.error("Media upload failed", e);
        return {
          src: "error",
          recenter: true,
          resize: !qsTruthy("noResize"),
          animateLoad: true,
          isObjectMenuTarget: true
        };
      });

    const eid = createNetworkedMedia(APP.world, params);
    const avatarPov = (document.querySelector("#avatar-pov-node")! as AElement).object3D;
    const obj = APP.world.eid2obj.get(eid)!;
    obj.position.copy(avatarPov.localToWorld(new Vector3(0, 0, -1.5)));
    obj.lookAt(avatarPov.getWorldPosition(new Vector3()));
  }
}

async function onPaste(e: ClipboardEvent) {
  if (!shouldUseNewLoader()) return;
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
  e.preventDefault();
  if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length) {
    return spawnFromFileList(e.clipboardData.files);
  }
  const text = e.clipboardData.getData("text");
  spawnFromUrl(text);
}

let lastDebugScene: string;
function onDrop(e: DragEvent) {
  if (!shouldUseNewLoader()) return;

  e.preventDefault();

  if (!(AFRAME as any).scenes[0].is("entered")) {
    return;
  }

  if (qsTruthy("debugLocalScene")) {
    URL.revokeObjectURL(lastDebugScene);
    if (!e.dataTransfer?.files.length) return;
    const url = URL.createObjectURL(e.dataTransfer.files[0]);
    APP.hubChannel!.updateScene(url);
    lastDebugScene = url;
    return;
  }

  const files = e.dataTransfer?.files;
  if (files && files.length) {
    return spawnFromFileList(files);
  }
  const url = e.dataTransfer?.getData("url") || e.dataTransfer?.getData("text");
  if (url) {
    return spawnFromUrl(url);
  }
}

document.addEventListener("paste", onPaste);
document.addEventListener("drop", onDrop);
