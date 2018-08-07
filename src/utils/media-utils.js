const whitelistedHosts = [/^.*\.reticulum\.io$/, /^.*hubs\.mozilla\.com$/, /^hubs\.local$/];
const isHostWhitelisted = hostname => !!whitelistedHosts.filter(r => r.test(hostname)).length;
let mediaAPIEndpoint = "/api/v1/media";
if (process.env.NODE_ENV === "development") {
  mediaAPIEndpoint = `https://${process.env.DEV_RETICULUM_SERVER}${mediaAPIEndpoint}`;
}

const resolveMediaCache = new Map();
export const resolveMedia = async url => {
  const parsedUrl = new URL(url);
  if (resolveMediaCache.has(url)) return resolveMediaCache.get(url);

  const resolved =
    (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") || isHostWhitelisted(parsedUrl.hostname)
      ? { raw: url, origin: url }
      : await fetch(mediaAPIEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ media: { url } })
        }).then(r => r.json());
  resolveMediaCache.set(url, resolved);
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
export const addMedia = (src, resize = false) => {
  const scene = AFRAME.scenes[0];

  const entity = document.createElement("a-entity");
  entity.id = "interactable-media-" + interactableId++;
  entity.setAttribute("networked", { template: "#interactable-media" });
  entity.setAttribute("media-loader", { resize, src: typeof src === "string" ? src : "" });
  scene.appendChild(entity);

  if (typeof src === "object") {
    upload(src)
      .then(response => {
        const src = response.raw;
        const contentType = response.meta.expected_content_type;
        const token = response.meta.access_token;
        entity.setAttribute("media-loader", { src, contentType, token });
      })
      .catch(() => {
        entity.setAttribute("media-loader", { src: "error" });
      });
  }
  return entity;
};
