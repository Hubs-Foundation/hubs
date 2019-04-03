import { objectTypeForOriginAndContentType } from "../object-types";
import { getReticulumFetchUrl } from "./phoenix-utils";
import mediaHighlightFrag from "./media-highlight-frag.glsl";
import { mapMaterials } from "./material-utils";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const nonCorsProxyDomains = (process.env.NON_CORS_PROXY_DOMAINS || "").split(",");
if (process.env.CORS_PROXY_SERVER) {
  nonCorsProxyDomains.push(process.env.CORS_PROXY_SERVER);
}
const mediaAPIEndpoint = getReticulumFetchUrl("/api/v1/media");

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

const PHYSICS_CONSTANTS = require("aframe-physics-system/src/constants"),
  SHAPE = PHYSICS_CONSTANTS.SHAPE,
  FIT = PHYSICS_CONSTANTS.FIT;

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
  if (
    process.env.RETICULUM_SERVER &&
    process.env.RETICULUM_SERVER.includes("hubs.local") &&
    url.includes("hubs.local")
  ) {
    return url;
  }

  return `https://${process.env.FARSPARK_SERVER}/thumbnail/${farsparkEncodeUrl(url)}?w=${width}&h=${height}`;
};

export const proxiedUrlFor = (url, index = null) => {
  if (!(url.startsWith("http:") || url.startsWith("https:"))) return url;

  const hasIndex = index !== null;

  if (!hasIndex) {
    // Skip known domains that do not require CORS proxying.
    try {
      const parsedUrl = new URL(url);
      if (nonCorsProxyDomains.find(domain => parsedUrl.hostname.endsWith(domain))) return url;
    } catch (e) {
      // Ignore
    }
  }

  if (hasIndex || !process.env.CORS_PROXY_SERVER) {
    const method = hasIndex ? "extract" : "raw";
    return `https://${process.env.FARSPARK_SERVER}/0/${method}/0/0/0/${index || 0}/${farsparkEncodeUrl(url)}`;
  } else {
    return `https://${process.env.CORS_PROXY_SERVER}/${url}`;
  }
};

const resolveUrlCache = new Map();
export const resolveUrl = async (url, index) => {
  const cacheKey = `${url}|${index}`;
  if (resolveUrlCache.has(cacheKey)) return resolveUrlCache.get(cacheKey);
  const resolved = await fetch(mediaAPIEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media: { url, index } })
  }).then(r => r.json());
  resolveUrlCache.set(cacheKey, resolved);
  return resolved;
};

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

export const guessContentType = url => {
  if (url.startsWith("hubs://") && url.endsWith("/video")) return "video/vnd.hubs-webrtc";
  const extension = new URL(url).pathname.split(".").pop();
  return commonKnownContentTypes[extension];
};

export const upload = file => {
  const formData = new FormData();
  formData.append("media", file);
  formData.append("promotion_mode", "with_token");
  return fetch(mediaAPIEndpoint, {
    method: "POST",
    body: formData
  }).then(r => r.json());
};

// https://stackoverflow.com/questions/7584794/accessing-jpeg-exif-rotation-data-in-javascript-on-the-client-side/32490603#32490603
function getOrientation(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const view = new DataView(e.target.result);
    if (view.getUint16(0, false) != 0xffd8) {
      return callback(-2);
    }
    const length = view.byteLength;
    let offset = 2;
    while (offset < length) {
      if (view.getUint16(offset + 2, false) <= 8) return callback(-1);
      const marker = view.getUint16(offset, false);
      offset += 2;
      if (marker == 0xffe1) {
        if (view.getUint32((offset += 2), false) != 0x45786966) {
          return callback(-1);
        }

        const little = view.getUint16((offset += 6), false) == 0x4949;
        offset += view.getUint32(offset + 4, little);
        const tags = view.getUint16(offset, little);
        offset += 2;
        for (let i = 0; i < tags; i++) {
          if (view.getUint16(offset + i * 12, little) == 0x0112) {
            return callback(view.getUint16(offset + i * 12 + 8, little));
          }
        }
      } else if ((marker & 0xff00) != 0xff00) {
        break;
      } else {
        offset += view.getUint16(offset, false);
      }
    }
    return callback(-1);
  };
  reader.readAsArrayBuffer(file);
}

let interactableId = 0;
export const addMedia = (src, template, contentOrigin, resolve = false, resize = false, animate = true) => {
  const scene = AFRAME.scenes[0];

  const entity = document.createElement("a-entity");
  entity.id = "interactable-media-" + interactableId++;
  entity.setAttribute("networked", { template: template });
  const needsToBeUploaded = src instanceof File;
  entity.setAttribute("media-loader", {
    resize,
    resolve,
    animate,
    src: typeof src === "string" ? src : "",
    fileIsOwned: !needsToBeUploaded
  });

  entity.object3D.matrixNeedsUpdate = true;

  scene.appendChild(entity);

  const fireLoadingTimeout = setTimeout(() => {
    scene.emit("media-loading", { src: src });
  }, 100);

  ["model-loaded", "video-loaded", "image-loaded"].forEach(eventName => {
    entity.addEventListener(
      eventName,
      async () => {
        clearTimeout(fireLoadingTimeout);
        scene.emit("media-loaded", { src: src });
      },
      { once: true }
    );
  });

  const orientation = new Promise(function(resolve) {
    if (needsToBeUploaded) {
      getOrientation(src, x => {
        resolve(x);
      });
    } else {
      resolve(1);
    }
  });
  if (needsToBeUploaded) {
    upload(src)
      .then(response => {
        const srcUrl = new URL(response.raw);
        srcUrl.searchParams.set("token", response.meta.access_token);
        entity.setAttribute("media-loader", { resolve: false, src: srcUrl.href, fileId: response.file_id });
        window.APP.store.update({
          uploadPromotionTokens: [{ fileId: response.file_id, promotionToken: response.meta.promotion_token }]
        });
      })
      .catch(e => {
        console.error("Media upload failed", e);
        entity.setAttribute("media-loader", { src: "error" });
      });
  } else if (src instanceof MediaStream) {
    entity.setAttribute("media-loader", { src: `hubs://clients/${NAF.clientId}/video` });
  }

  if (contentOrigin) {
    entity.addEventListener("media_resolved", ({ detail }) => {
      const objectType = objectTypeForOriginAndContentType(contentOrigin, detail.contentType, detail.src);
      scene.emit("object_spawned", { objectType });
    });
  }

  return { entity, orientation };
};

export function injectCustomShaderChunks(obj) {
  const vertexRegex = /\bskinning_vertex\b/;
  const fragRegex = /\bgl_FragColor\b/;
  const validMaterials = ["MeshStandardMaterial", "MeshBasicMaterial", "MobileStandardMaterial"];

  const shaderUniforms = new Map();

  obj.traverse(object => {
    if (!object.material) return;

    object.material = mapMaterials(object, material => {
      if (!validMaterials.includes(material.type)) {
        return material;
      }

      // HACK, this routine inadvertently leaves the A-Frame shaders wired to the old, dark
      // material, so maps cannot be updated at runtime. This breaks UI elements who have
      // hover/toggle state, so for now just skip these while we figure out a more correct
      // solution.
      if (object.el.classList.contains("ui")) return material;
      if (object.el.classList.contains("hud")) return material;
      if (object.el.getAttribute("text-button")) return material;

      const newMaterial = material.clone();
      newMaterial.onBeforeCompile = shader => {
        if (!vertexRegex.test(shader.vertexShader)) return;

        shader.uniforms.hubs_IsFrozen = { value: false };
        shader.uniforms.hubs_EnableSweepingEffect = { value: false };
        shader.uniforms.hubs_SweepParams = { value: [0, 0] };
        shader.uniforms.hubs_InteractorOnePos = { value: [0, 0, 0] };
        shader.uniforms.hubs_InteractorTwoPos = { value: [0, 0, 0] };
        shader.uniforms.hubs_HighlightInteractorOne = { value: false };
        shader.uniforms.hubs_HighlightInteractorTwo = { value: false };
        shader.uniforms.hubs_Time = { value: 0 };

        const vchunk = `
        if (hubs_HighlightInteractorOne || hubs_HighlightInteractorTwo || hubs_IsFrozen) {
          vec4 wt = modelMatrix * vec4(transformed, 1);

          // Used in the fragment shader below.
          hubs_WorldPosition = wt.xyz;
        }
      `;

        const vlines = shader.vertexShader.split("\n");
        const vindex = vlines.findIndex(line => vertexRegex.test(line));
        vlines.splice(vindex + 1, 0, vchunk);
        vlines.unshift("varying vec3 hubs_WorldPosition;");
        vlines.unshift("uniform bool hubs_IsFrozen;");
        vlines.unshift("uniform bool hubs_HighlightInteractorOne;");
        vlines.unshift("uniform bool hubs_HighlightInteractorTwo;");
        shader.vertexShader = vlines.join("\n");

        const flines = shader.fragmentShader.split("\n");
        const findex = flines.findIndex(line => fragRegex.test(line));
        flines.splice(findex + 1, 0, mediaHighlightFrag);
        flines.unshift("varying vec3 hubs_WorldPosition;");
        flines.unshift("uniform bool hubs_IsFrozen;");
        flines.unshift("uniform bool hubs_EnableSweepingEffect;");
        flines.unshift("uniform vec2 hubs_SweepParams;");
        flines.unshift("uniform bool hubs_HighlightInteractorOne;");
        flines.unshift("uniform vec3 hubs_InteractorOnePos;");
        flines.unshift("uniform bool hubs_HighlightInteractorTwo;");
        flines.unshift("uniform vec3 hubs_InteractorTwoPos;");
        flines.unshift("uniform float hubs_Time;");
        shader.fragmentShader = flines.join("\n");

        shaderUniforms.set(newMaterial.uuid, shader.uniforms);
      };
      newMaterial.needsUpdate = true;
      return newMaterial;
    });
  });

  return shaderUniforms;
}

export function getPromotionTokenForFile(fileId) {
  return window.APP.store.state.uploadPromotionTokens.find(upload => upload.fileId === fileId);
}

export function generateMeshBVH(object3D) {
  object3D.traverse(obj => {
    // note that we might already have a bounds tree if this was a clone of an object with one
    const hasBufferGeometry = obj.isMesh && obj.geometry.isBufferGeometry;
    const hasBoundsTree = hasBufferGeometry && obj.geometry.boundsTree;
    if (hasBufferGeometry && !hasBoundsTree && obj.geometry.attributes.position) {
      const geo = obj.geometry;
      const triCount = geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3;
      // only bother using memory and time making a BVH if there are a reasonable number of tris,
      // and if there are too many it's too painful and large to tolerate doing it (at least until
      // we put this in a web worker)
      if (triCount > 1000 && triCount < 1000000) {
        // note that bounds tree construction creates an index as a side effect if one doesn't already exist
        geo.boundsTree = new MeshBVH(obj.geometry, { strategy: 0, maxDepth: 30 });
      }
    }
  });
}

export const traverseMeshesAndAddShapes = (function() {
  const vertexLimit = 200000;
  const shapePrefix = "ammo-shape__";
  const shapes = [];
  return function(el) {
    const meshRoot = el.object3DMap.mesh;
    while (shapes.length > 0) {
      const { id, entity } = shapes.pop();
      entity.removeAttribute(id);
    }

    let vertexCount = 0;
    meshRoot.traverse(o => {
      if (
        o.isMesh &&
        (!THREE.Sky || o.__proto__ != THREE.Sky.prototype) &&
        o.name !== "Floor_Plan" &&
        o.name !== "Ground_Plane"
      ) {
        vertexCount += o.geometry.attributes.position.count;
      }
    });

    console.group("traverseMeshesAndAddShapes");

    console.log(`scene has ${vertexCount} vertices`);

    const floorPlan = meshRoot.children.find(obj => {
      return obj.name === "Floor_Plan";
    });
    if (vertexCount > vertexLimit && floorPlan) {
      console.log(`vertex limit of ${vertexLimit} exceeded, using floor plan with mesh shape`);
      floorPlan.el.setAttribute(shapePrefix + floorPlan.name, {
        type: SHAPE.MESH,
        margin: 0.01,
        fit: FIT.ALL
      });
      shapes.push({ id: shapePrefix + floorPlan.name, entity: floorPlan.el });
    } else if (vertexCount < vertexLimit) {
      for (let i = 0; i < meshRoot.children.length; i++) {
        const obj = meshRoot.children[i];

        //ignore floor plan for spoke scenes, and make the ground plane a box.
        if (obj.isGroup && obj.name !== "Floor_Plan") {
          if (obj.name === "Ground_Plane") {
            obj.el.object3DMap.mesh = obj;
            obj.el.setAttribute(shapePrefix + obj.name, {
              type: SHAPE.BOX,
              margin: 0.01,
              fit: FIT.ALL
            });
            shapes.push({ id: shapePrefix + obj.name, entity: obj.el });
            continue;
          }

          if (!obj.el.object3DMap.mesh) {
            obj.el.object3DMap.mesh = obj.parent;
          }

          obj.el.setAttribute(shapePrefix + obj.uuid, {
            type: SHAPE.MESH,
            margin: 0.01,
            fit: FIT.COMPOUND
          });
          shapes.push({ id: shapePrefix + obj.uuid, entity: obj.el });
        }
      }
      console.log(`traversing meshes and adding ${shapes.length} mesh shapes`);
    } else {
      el.setAttribute(shapePrefix + "defaultFloor", {
        type: SHAPE.BOX,
        margin: 0.01,
        halfExtents: { x: 4000, y: 0.5, z: 4000 },
        offset: { x: 0, y: -0.5, z: 0 },
        fit: FIT.MANUAL
      });
      shapes.push({ id: shapePrefix + "defaultFloor", entity: el });
      console.log(`adding default floor collision`);
    }
    console.groupEnd();
  };
})();

const hubsSceneRegex = /https?:\/\/(hubs.local(:\d+)?|(smoke-)?hubs.mozilla.com)\/scenes\/(\w+)\/?\S*/;
const hubsRoomRegex = /https?:\/\/(hubs.local(:\d+)?|(smoke-)?hubs.mozilla.com)\/(\w+)\/?\S*/;
export const isHubsSceneUrl = hubsSceneRegex.test.bind(hubsSceneRegex);
export const isHubsRoomUrl = url => !isHubsSceneUrl(url) && hubsRoomRegex.test(url);
export const isHubsDestinationUrl = url => isHubsSceneUrl(url) || isHubsRoomUrl(url);
