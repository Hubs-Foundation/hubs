const nonCorsProxyDomains = (process.env.NON_CORS_PROXY_DOMAINS || "").split(",");
if (process.env.CORS_PROXY_SERVER) {
  nonCorsProxyDomains.push(process.env.CORS_PROXY_SERVER);
}

const commonKnownContentTypes = {
  gltf: "model/gltf",
  glb: "model/gltf-binary",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  pdf: "application/pdf",
  mp4: "video/mp4",
  mp3: "audio/mpeg"
};

// thanks to https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
function b64EncodeUnicode(str) {
  // first we use encodeURIComponent to get percent-encoded UTF-8, then we convert the percent-encodings
  // into raw bytes which can be fed into btoa.
  const CHAR_RE = /%([0-9A-F]{2})/g;
  return btoa(encodeURIComponent(str).replace(CHAR_RE, (_, p1) => String.fromCharCode("0x" + p1)));
}

const farsparkEncodeUrl = url => {
  // farspark doesn't know how to read '=' base64 padding characters
  // translate base64 + to - and / to _ for URL safety
  return b64EncodeUnicode(url)
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

export const scaledThumbnailUrlFor = (url, width, height) => {
  const farsparkUrl = `https://${process.env.THUMBNAIL_SERVER}/thumbnail/${farsparkEncodeUrl(
    url
  )}?w=${width}&h=${height}`;

  try {
    const urlHostname = new URL(url).hostname;

    if (process.env.RETICULUM_SERVER) {
      const retHostname = new URL(`https://${process.env.RETICULUM_SERVER}`).hostname;
      if (retHostname === urlHostname) return url;
    }
  } catch (e) {
    return farsparkUrl;
  }

  return farsparkUrl;
};

export const isNonCorsProxyDomain = hostname => {
  return nonCorsProxyDomains.find(domain => hostname.endsWith(domain));
};

export const proxiedUrlFor = url => {
  if (!(url.startsWith("http:") || url.startsWith("https:"))) return url;

  // Skip known domains that do not require CORS proxying.
  try {
    const parsedUrl = new URL(url);
    if (isNonCorsProxyDomain(parsedUrl.hostname)) return url;
  } catch (e) {
    // Ignore
  }

  return `https://${process.env.CORS_PROXY_SERVER}/${url}`;
};

export function getAbsoluteUrl(baseUrl, relativeUrl) {
  return new URL(relativeUrl, baseUrl);
}

export function getAbsoluteHref(baseUrl, relativeUrl) {
  return getAbsoluteUrl(baseUrl, relativeUrl).href;
}

export const getCustomGLTFParserURLResolver = gltfUrl => url => {
  if (typeof url !== "string" || url === "") return "";
  if (/^(https?:)?\/\//i.test(url)) return url;
  if (/^data:.*,.*$/i.test(url)) return url;
  if (/^blob:.*$/i.test(url)) return url;

  if (process.env.CORS_PROXY_SERVER) {
    // For absolute paths with a CORS proxied gltf URL, re-write the url properly to be proxied
    const corsProxyPrefix = `https://${process.env.CORS_PROXY_SERVER}/`;

    if (gltfUrl.startsWith(corsProxyPrefix)) {
      const originalUrl = decodeURIComponent(gltfUrl.substring(corsProxyPrefix.length));
      const originalUrlParts = originalUrl.split("/");

      // Drop the .gltf filename
      const path = new URL(url).pathname;
      const assetUrl = originalUrlParts.slice(0, originalUrlParts.length - 1).join("/") + "/" + path;
      return corsProxyPrefix + assetUrl;
    }
  }

  return url;
};

const dataUrlRegex = /data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/;

export const guessContentType = url => {
  if (!url) return;
  if (url.startsWith("hubs://") && url.endsWith("/video")) return "video/vnd.hubs-webrtc";
  if (url.startsWith("data:")) {
    const matches = dataUrlRegex.exec(url);
    if (matches.length > 0) {
      matches[1];
    }
  }
  const extension = new URL(url, window.location).pathname.split(".").pop();
  return commonKnownContentTypes[extension];
};
const hubsSceneRegex = /https?:\/\/(hubs.local(:\d+)?|(smoke-)?hubs.mozilla.com|(dev\.)?reticulum.io)\/scenes\/(\w+)\/?\S*/;
const hubsAvatarRegex = /https?:\/\/(hubs.local(:\d+)?|(smoke-)?hubs.mozilla.com|(dev\.)?reticulum.io)\/avatars\/(?<id>\w+)\/?\S*/;
const hubsRoomRegex = /(https?:\/\/)?(hub.link)|(hubs.local(:\d+)?|(smoke-)?hubs.mozilla.com|(dev\.)?reticulum.io)\/(\w+)\/?\S*/;

export const isHubsSceneUrl = hubsSceneRegex.test.bind(hubsSceneRegex);
export const isHubsRoomUrl = url => !isHubsSceneUrl(url) && hubsRoomRegex.test(url);
export const isHubsDestinationUrl = url => isHubsSceneUrl(url) || isHubsRoomUrl(url);
export const isHubsAvatarUrl = hubsAvatarRegex.test.bind(hubsAvatarRegex);

export const idForAvatarUrl = url => {
  const match = url.match(hubsAvatarRegex);
  if (match) {
    return match.groups.id;
  }
  return null;
};
