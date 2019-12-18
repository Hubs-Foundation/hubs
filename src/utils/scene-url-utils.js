import { isHubsSceneUrl, proxiedUrlFor } from "../utils/media-url-utils";

export async function isValidGLB(url) {
  return fetch(url).then(r => {
    const reader = r.body.getReader();
    return reader.read().then(result => {
      reader.cancel();
      return String.fromCharCode.apply(null, result.value.slice(0, 4)) === "glTF";
    });
  });
}

export async function isValidSceneUrl(url) {
  if (url.trim() === "") return false;
  if (!url.startsWith("http")) return false;
  if (await isHubsSceneUrl(url)) {
    return true;
  } else {
    return isValidGLB(proxiedUrlFor(url));
  }
}
