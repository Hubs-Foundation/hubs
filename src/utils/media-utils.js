import { getBox, getCenterAndHalfExtents, getScaleCoefficient } from "./auto-box-collider";
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

const fetchContentType = async url => fetch(url, { method: "HEAD" }).then(r => r.headers.get("content-type"));

let interactableId = 0;
const offset = { x: 0, y: 0, z: -1.5 };
export const spawnNetworkedImage = (entity, src, contentType) => {
  entity.id = "interactable-image-" + interactableId++;
  entity.setAttribute("networked", { template: "#interactable-image" });
  entity.addEventListener("image-loaded", function onBodyLoaded() {
    entity.removeEventListener("image-loaded", onBodyLoaded);
  });
  entity.setAttribute("image-plus", { src, contentType });
};

export const spawnNetworkedInteractable = (entity, src, basePath) => {
  entity.id = "interactable-model-" + interactableId++;
  entity.setAttribute("networked", { template: "#interactable-model" });
  entity.addEventListener("model-loaded", function onBodyLoaded() {
    entity.removeEventListener("model-loaded", onBodyLoaded);
    setShapeAndScale(entity);
  });
  entity.setAttribute("gltf-model-plus", { src: src, basePath: basePath });
};

export const addMedia = async url => {
  const scene = AFRAME.scenes[0];

  const entity = document.createElement("a-entity");
  entity.setObject3D("mesh", new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));
  entity.classList.add("interactable");
  entity.setAttribute("body", { type: "dynamic", shape: "none", mass: "1" });
  entity.setAttribute("grabbable", "");
  entity.setAttribute("hoverable", "");
  entity.setAttribute("stretchable", { useWorldPosition: true, usePhysics: "never" });
  entity.setAttribute("sticky-object", { autoLockOnRelease: true, autoLockOnLoad: true });
  entity.setAttribute("destroy-at-extreme-distances", "");
  entity.setAttribute("offset-relative-to", {
    target: "#player-camera",
    offset: offset,
    selfDestruct: true
  });
  setShapeAndScale(entity);
  scene.appendChild(entity);

  try {
    const { raw, origin, meta } = await resolveFarsparkUrl(url);
    console.log("resolved", url, raw, origin, meta);

    const contentType = (meta && meta.expected_content_type) || (await fetchContentType(raw));
    if (contentType.startsWith("image/") || contentType.startsWith("video/")) {
      return spawnNetworkedImage(entity, raw, contentType);
    } else if (contentType.startsWith("model/gltf") || url.endsWith(".gltf") || url.endsWith(".glb")) {
      return spawnNetworkedInteractable(entity, raw, THREE.LoaderUtils.extractUrlBase(origin));
    } else {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
  } catch (e) {
    console.error("Error adding media", e);
    return spawnNetworkedImage(entity, "error");
  }
};

function setShapeAndScale(entity) {
  const box = getBox(entity);
  const center = new THREE.Vector3();
  const halfExtents = new THREE.Vector3();
  getCenterAndHalfExtents(entity, box, center, halfExtents);
  entity.getObject3D("mesh").position.sub(center);
  const scaleCoefficient = getScaleCoefficient(0.5, box);
  entity.setAttribute("shape", {
    shape: "box",
    halfExtents: halfExtents
  });
  const scale = entity.object3D.scale;
  entity.setAttribute("scale", {
    x: scale.x * scaleCoefficient,
    y: scale.y * scaleCoefficient,
    z: scale.z * scaleCoefficient
  });
  if (entity.components.body && entity.components.body.body) {
    // TODO: Do this in shape component update
    entity.components.body.syncToPhysics();
    entity.components.body.updateCannonScale();
  }
}
