const whitelistedHosts = [/^.*\.reticulum\.io$/, /^.*hubs\.mozilla\.com$/, /^hubs\.local$/];
const isHostWhitelisted = hostname => !!whitelistedHosts.filter(r => r.test(hostname)).length;

let resolveMediaUrl = "/api/v1/media";
if (process.env.NODE_ENV === "development") {
  resolveMediaUrl = `https://${process.env.DEV_RETICULUM_SERVER}${resolveMediaUrl}`;
}

export const resolveFarsparkUrl = async url => {
  const parsedUrl = new URL(url);
  if ((parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") || isHostWhitelisted(parsedUrl.hostname))
    return url;

  return (await fetch(resolveMediaUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media: { url } })
  }).then(r => r.json())).raw;
};

const fetchContentType = async url => fetch(url, { method: "HEAD" }).then(r => r.headers.get("content-type"));
let interactableId = 0;

const offset = { x: 0, y: 0, z: -1.5 };
export const spawnNetworkedImage = (src, contentType) => {
  const scene = AFRAME.scenes[0];
  const image = document.createElement("a-entity");
  image.id = "interactable-image-" + interactableId++;
  image.setAttribute("networked", { template: "#interactable-image" });
  image.setAttribute("offset-relative-to", {
    target: "#player-camera",
    offset: offset,
    selfDestruct: true
  });
  image.setAttribute("image-plus", { src, contentType });
  scene.appendChild(image);
  return image;
};

export const spawnNetworkedInteractable = src => {
  const scene = AFRAME.scenes[0];
  const model = document.createElement("a-entity");
  model.id = "interactable-model-" + interactableId++;
  model.setAttribute("networked", { template: "#interactable-model" });
  model.setAttribute("offset-relative-to", {
    on: "model-loaded",
    target: "#player-camera",
    offset: offset,
    selfDestruct: true
  });
  model.setAttribute("gltf-model-plus", "src", src);
  model.setAttribute("auto-box-collider", { resize: true });
  scene.appendChild(model);
  return model;
};

export const addMedia = async url => {
  try {
    const farsparkUrl = await resolveFarsparkUrl(url);
    console.log("resolved", url, farsparkUrl);

    const contentType = await fetchContentType(farsparkUrl);

    if (contentType.startsWith("image/") || contentType.startsWith("video/")) {
      spawnNetworkedImage(farsparkUrl, contentType);
    } else if (contentType.startsWith("model/gltf") || url.endsWith(".gltf") || url.endsWith(".glb")) {
      spawnNetworkedInteractable(farsparkUrl);
    } else {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
  } catch (e) {
    console.error("Error adding media", e);
    spawnNetworkedImage("error");
  }
};
