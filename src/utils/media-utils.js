import { objectTypeForOriginAndContentType } from "../object-types";
let mediaAPIEndpoint = "/api/v1/media";

if (process.env.RETICULUM_SERVER) {
  mediaAPIEndpoint = `https://${process.env.RETICULUM_SERVER}${mediaAPIEndpoint}`;
}

const fetchContentType = async url => {
  return fetch(url, { method: "HEAD" }).then(r => r.headers.get("content-type"));
};

const contentIndexCache = new Map();
export const fetchMaxContentIndex = async (documentUrl, pageUrl) => {
  if (contentIndexCache.has(documentUrl)) return contentIndexCache.get(documentUrl);
  const maxIndex = await fetch(pageUrl).then(r => parseInt(r.headers.get("x-max-content-index")));
  contentIndexCache.set(documentUrl, maxIndex);
  return maxIndex;
};

const resolveMediaCache = new Map();
export const resolveMedia = async (url, skipContentType, index) => {
  const parsedUrl = new URL(url);
  const cacheKey = `${url}|${index}`;
  if (resolveMediaCache.has(cacheKey)) return resolveMediaCache.get(cacheKey);

  const isHttpOrHttps = parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  const resolved = !isHttpOrHttps
    ? { raw: url, origin: url }
    : await fetch(mediaAPIEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media: { url, index } })
      }).then(r => r.json());

  if (isHttpOrHttps && !skipContentType) {
    const contentType =
      (resolved.meta && resolved.meta.expected_content_type) || (await fetchContentType(resolved.raw));
    resolved.contentType = contentType;
  }

  resolveMediaCache.set(cacheKey, resolved);
  return resolved;
};

export const upload = file => {
  const formData = new FormData();
  formData.append("media", file);
  return fetch(mediaAPIEndpoint, {
    method: "POST",
    body: formData
  }).then(r => r.json());
};

let interactableId = 0;
export const addMedia = (src, template, contentOrigin, resize = false) => {
  const scene = AFRAME.scenes[0];

  const entity = document.createElement("a-entity");
  entity.id = "interactable-media-" + interactableId++;
  entity.setAttribute("networked", { template: template });
  entity.setAttribute("media-loader", { resize, src: typeof src === "string" ? src : "" });
  scene.appendChild(entity);

  if (src instanceof File) {
    upload(src)
      .then(response => {
        const srcUrl = new URL(response.raw);
        srcUrl.searchParams.set("token", response.meta.access_token);
        entity.setAttribute("media-loader", { src: srcUrl.href });
      })
      .catch(() => {
        entity.setAttribute("media-loader", { src: "error" });
      });
  }

  entity.addEventListener("media_resolved", ({ detail }) => {
    const objectType = objectTypeForOriginAndContentType(contentOrigin, detail.contentType);
    scene.emit("object_spawned", { objectType });
  });

  return entity;
};
