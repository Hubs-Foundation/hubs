import { isLocalHubsSceneUrl, proxiedUrlFor } from "../utils/media-url-utils";

export async function isValidGLB(url) {
  return fetch(url)
    .then(async r => {
      const reader = r.body.getReader();
      let header = "";
      function readChunk({ done, value }) {
        header += String.fromCharCode.apply(null, value.slice(0, 4));
        if (!done && header.length < 4) {
          return reader.read().then(readChunk);
        } else {
          reader.cancel();
        }
      }
      await reader.read().then(readChunk);
      return header.startsWith("glTF");
    })
    .catch(e => console.error(e));
}

export async function isValidSceneUrl(url) {
  if (url.trim() === "") return false;
  if (!url.startsWith("http")) return false;
  if (await isLocalHubsSceneUrl(url)) {
    return true;
  } else {
    return isValidGLB(proxiedUrlFor(url));
  }
}
