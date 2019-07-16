import { objectTypeForOriginAndContentType } from "../object-types";
import { getReticulumFetchUrl } from "./phoenix-utils";
import mediaHighlightFrag from "./media-highlight-frag.glsl";
import { mapMaterials } from "./material-utils";
import HubsTextureLoader from "../loaders/HubsTextureLoader";
import { validMaterials } from "../components/hoverable-visuals";

const mediaAPIEndpoint = getReticulumFetchUrl("/api/v1/media");

const resolveUrlCache = new Map();
export const resolveUrl = async (url, index) => {
  const cacheKey = `${url}|${index}`;
  if (resolveUrlCache.has(cacheKey)) return resolveUrlCache.get(cacheKey);

  const response = await fetch(mediaAPIEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media: { url, index } })
  });

  if (!response.ok) {
    const message = `Error resolving url "${url}":`;
    try {
      const body = await response.text();
      throw new Error(message + " " + body);
    } catch (e) {
      throw new Error(message + " " + response.statusText);
    }
  }

  const resolved = await response.json();
  resolveUrlCache.set(cacheKey, resolved);
  return resolved;
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
export const addMedia = (
  src,
  template,
  contentOrigin,
  contentSubtype = null,
  resolve = false,
  resize = false,
  animate = true
) => {
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
    contentSubtype,
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

  const shaderUniforms = [];
  const batchManagerSystem = AFRAME.scenes[0].systems["hubs-systems"].batchManagerSystem;

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
      if (
        object.el.classList.contains("ui") ||
        object.el.classList.contains("hud") ||
        object.el.getAttribute("text-button")
      )
        return material;

      // Used when the object is batched
      batchManagerSystem.meshToEl.set(object, obj.el);

      const newMaterial = material.clone();
      // This will not run if the object is never rendered unbatched, since its unbatched shader will never be compiled
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

        shaderUniforms.push(shader.uniforms);
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

const mediaPos = new THREE.Vector3();

export function spawnMediaAround(el, media, contentSubtype, snapCount, mirrorOrientation = false) {
  const { entity, orientation } = addMedia(media, "#interactable-media", undefined, contentSubtype, false);

  const pos = el.object3D.position;

  entity.object3D.position.set(pos.x, pos.y, pos.z);
  entity.object3D.rotation.copy(el.object3D.rotation);

  if (mirrorOrientation) {
    entity.object3D.rotateY(Math.PI);
  }

  // Generate photos in a circle around camera, starting from the bottom.
  // Prevent z-fighting but place behind viewfinder
  const idx = (snapCount % 6) + 3;

  mediaPos.set(
    Math.cos(Math.PI * 2 * (idx / 6.0)) * 0.75,
    Math.sin(Math.PI * 2 * (idx / 6.0)) * 0.75,
    -0.05 + idx * 0.001
  );

  el.object3D.localToWorld(mediaPos);
  entity.object3D.visible = false;

  entity.addEventListener(
    "image-loaded",
    () => {
      entity.object3D.visible = true;
      entity.setAttribute("animation__photo_pos", {
        property: "position",
        dur: 800,
        from: { x: pos.x, y: pos.y, z: pos.z },
        to: { x: mediaPos.x, y: mediaPos.y, z: mediaPos.z },
        easing: "easeOutElastic"
      });
    },
    { once: true }
  );

  entity.object3D.matrixNeedsUpdate = true;

  entity.addEventListener(
    "media_resolved",
    () => {
      el.emit("photo_taken", entity.components["media-loader"].data.src);
    },
    { once: true }
  );

  return { entity, orientation };
}

export const textureLoader = new HubsTextureLoader().setCrossOrigin("anonymous");

export async function createImageTexture(url) {
  const texture = new THREE.Texture();

  try {
    await textureLoader.loadTextureAsync(texture, url);
  } catch (e) {
    throw new Error(`'${url}' could not be fetched (Error code: ${e.status}; Response: ${e.statusText})`);
  }

  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = 4;

  return texture;
}
