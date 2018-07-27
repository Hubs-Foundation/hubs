const whitelistedHosts = [/^.*\.reticulum\.io$/, /^.*hubs\.mozilla\.com$/, /^hubs\.local$/];
const isHostWhitelisted = hostname => !!whitelistedHosts.filter(r => r.test(hostname)).length;
let resolveMediaUrl = "/api/v1/media";
if (process.env.NODE_ENV === "development") {
  resolveMediaUrl = `https://${process.env.DEV_RETICULUM_SERVER}${resolveMediaUrl}`;
}

export const resolveFarsparkUrl = async url => {
  const parsedUrl = new URL(url);
  if ((parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") || isHostWhitelisted(parsedUrl.hostname))
    return { raw: url, origin: url };

  return await fetch(resolveMediaUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media: { url } })
  }).then(r => r.json());
};

let interactableId = 0;
export const addMedia = (src, template, resize = false) => {
  const scene = AFRAME.scenes[0];

  const entity = document.createElement("a-entity");
  entity.id = "interactable-media-" + interactableId++;
  entity.setAttribute("networked", { template: template });
  entity.setAttribute("media-loader", { src, resize });
  scene.appendChild(entity);
  return entity;
};
