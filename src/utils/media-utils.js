const whitelistedHosts = [/^.*\.reticulum\.io$/, /^.*hubs\.mozilla\.com$/, /^hubs\.local$/];
const isHostWhitelisted = hostname => !!whitelistedHosts.filter(r => r.test(hostname)).length;
let mediaAPIEndpoint = "/api/v1/media";

if (process.env.RETICULUM_SERVER) {
  mediaAPIEndpoint = `https://${process.env.RETICULUM_SERVER}${mediaAPIEndpoint}`;
}

const fetchContentType = async (url, token) => {
  const args = { method: "HEAD" };

  if (token) {
    args.headers = { Authorization: `Token ${token}` };
  }

  return fetch(url, args).then(r => r.headers.get("content-type"));
};

const resolveMediaCache = new Map();
export const resolveMedia = async (url, token, skipContentType) => {
  const parsedUrl = new URL(url);
  if (resolveMediaCache.has(url)) return resolveMediaCache.get(url);

  const isNotHttpOrHttps = parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:";
  const resolved =
    isNotHttpOrHttps || isHostWhitelisted(parsedUrl.hostname)
      ? { raw: url, origin: url }
      : await fetch(mediaAPIEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ media: { url } })
        }).then(r => r.json());

  if (!isNotHttpOrHttps && !skipContentType) {
    const contentType =
      (resolved.meta && resolved.meta.expected_content_type) || (await fetchContentType(resolved.raw, token));
    resolved.contentType = contentType;
  }

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

  if (src instanceof File) {
    upload(src)
      .then(response => {
        const src = response.raw;
        const token = response.meta.access_token;
        entity.setAttribute("media-loader", { src, token });
      })
      .catch(() => {
        entity.setAttribute("media-loader", { src: "error" });
      });
  }
  return entity;
};
