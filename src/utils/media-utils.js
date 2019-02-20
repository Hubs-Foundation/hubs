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

export const proxiedUrlFor = (url, index) => {
  if (!(url.startsWith("http:") || url.startsWith("https:"))) return url;

  // Skip known domains that do not require CORS proxying.
  try {
    const parsedUrl = new URL(url);
    if (nonCorsProxyDomains.find(domain => parsedUrl.hostname.endsWith(domain))) return url;
  } catch (e) {
    // Ignore
  }

  if (index != null || !process.env.CORS_PROXY_SERVER) {
    const method = index != null ? "extract" : "raw";
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
export const addMedia = (src, template, contentOrigin, resolve = false, resize = false) => {
  const scene = AFRAME.scenes[0];

  const entity = document.createElement("a-entity");
  entity.id = "interactable-media-" + interactableId++;
  entity.setAttribute("networked", { template: template });
  const needsToBeUploaded = src instanceof File;
  entity.setAttribute("media-loader", {
    resize,
    resolve,
    src: typeof src === "string" ? src : "",
    fileIsOwned: !needsToBeUploaded
  });

  const [sx, sy, sz] = [entity.object3D.scale.x, entity.object3D.scale.y, entity.object3D.scale.z];
  entity.object3D.scale.set(sx / 2, sy / 2, sz / 2);

  entity.setAttribute("animation__loader_spawn-start", {
    property: "scale",
    delay: 50,
    dur: 200,
    from: { x: sx / 2, y: sy / 2, z: sz / 2 },
    to: { x: sx, y: sy, z: sz },
    easing: "easeInQuad"
  });

  scene.appendChild(entity);

  const fireLoadingTimeout = setTimeout(() => {
    scene.emit("media-loading", { src: src });
  }, 100);

  ["model-loaded", "video-loaded", "image-loaded"].forEach(eventName => {
    entity.addEventListener(eventName, () => {
      clearTimeout(fireLoadingTimeout);

      entity.removeAttribute("animation__loader_spawn-start");
      const [sx, sy, sz] = [entity.object3D.scale.x, entity.object3D.scale.y, entity.object3D.scale.z];
      entity.object3D.scale.set(sx / 2, sy / 2, sz / 2);
      entity.object3D.matrixNeedsUpdate = true;

      if (!entity.classList.contains("pen") && !entity.getAttribute("animation__spawn-start")) {
        entity.setAttribute("animation__spawn-start", {
          property: "scale",
          delay: 50,
          dur: 300,
          from: { x: sx / 2, y: sy / 2, z: sz / 2 },
          to: { x: sx, y: sy, z: sz },
          easing: "easeOutElastic"
        });
      }

      scene.emit("media-loaded", { src: src });
    });
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

        shader.uniforms.hubs_EnableSweepingEffect = { value: false };
        shader.uniforms.hubs_SweepParams = { value: [0, 0] };
        shader.uniforms.hubs_InteractorOnePos = { value: [0, 0, 0] };
        shader.uniforms.hubs_InteractorTwoPos = { value: [0, 0, 0] };
        shader.uniforms.hubs_HighlightInteractorOne = { value: false };
        shader.uniforms.hubs_HighlightInteractorTwo = { value: false };
        shader.uniforms.hubs_Time = { value: 0 };

        const vchunk = `
        if (hubs_HighlightInteractorOne || hubs_HighlightInteractorTwo) {
          vec4 wt = modelMatrix * vec4(transformed, 1);

          // Used in the fragment shader below.
          hubs_WorldPosition = wt.xyz;
        }
      `;

        const vlines = shader.vertexShader.split("\n");
        const vindex = vlines.findIndex(line => vertexRegex.test(line));
        vlines.splice(vindex + 1, 0, vchunk);
        vlines.unshift("varying vec3 hubs_WorldPosition;");
        vlines.unshift("uniform bool hubs_HighlightInteractorOne;");
        vlines.unshift("uniform bool hubs_HighlightInteractorTwo;");
        shader.vertexShader = vlines.join("\n");

        const flines = shader.fragmentShader.split("\n");
        const findex = flines.findIndex(line => fragRegex.test(line));
        flines.splice(findex + 1, 0, mediaHighlightFrag);
        flines.unshift("varying vec3 hubs_WorldPosition;");
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
    if (hasBufferGeometry && !hasBoundsTree) {
      // we can't currently build a BVH for geometries with groups, because the groups rely on the
      // existing ordering of the index, which we kill as a result of building the tree
      if (obj.geometry.groups && obj.geometry.groups.length) {
        console.warn("BVH construction not supported for geometry with groups; raycasting may suffer.");
      } else {
        const geo = obj.geometry;
        const triCount = geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3;
        // only bother using memory and time making a BVH if there are a reasonable number of tris,
        // and if there are too many it's too painful and large to tolerate doing it (at least until
        // we put this in a web worker)
        if (triCount > 1000 && triCount < 1000000) {
          geo.boundsTree = new MeshBVH(obj.geometry, { strategy: 0, maxDepth: 30 });
          geo.setIndex(geo.boundsTree.index);
        }
      }
    }
  });
}

exports.traverseMeshesAndAddShapes = (function() {
  const matrix = new THREE.Matrix4();
  const inverse = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const shapePrefix = "ammo-shape__env";
  return function(el, type, margin) {
    const shapes = [];
    let i = 0;
    const meshRoot = el.object3DMap.mesh;
    inverse.getInverse(meshRoot.matrixWorld);
    meshRoot.traverse(o => {
      if (o.isMesh && (!THREE.Sky || o.__proto__ != THREE.Sky.prototype)) {
        o.updateMatrices();
        matrix.multiplyMatrices(inverse, o.matrixWorld);
        matrix.decompose(pos, quat, scale);
        el.setAttribute(shapePrefix + i, {
          type: type,
          margin: margin,
          mergeGeometry: false,
          offset: { x: pos.x * meshRoot.scale.x, y: pos.y * meshRoot.scale.y, z: pos.z * meshRoot.scale.z },
          orientation: { x: quat.x, y: quat.y, z: quat.z, w: quat.w }
        });
        el.components[shapePrefix + i].setMesh(o);
        shapes.push(shapePrefix + i);
        i++;
      }
    });
    return shapes;
  };
})();
