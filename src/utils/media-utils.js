import { objectTypeForOriginAndContentType } from "../object-types";
import { getReticulumFetchUrl } from "./phoenix-utils";
import mediaHighlightFrag from "./media-highlight-frag.glsl";

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

export const proxiedUrlFor = (url, index) => {
  if (!(url.startsWith("http:") || url.startsWith("https:"))) return url;

  // farspark doesn't know how to read '=' base64 padding characters
  const base64Url = b64EncodeUnicode(url).replace(/=+$/g, "");
  // translate base64 + to - and / to _ for URL safety
  const encodedUrl = base64Url.replace(/\+/g, "-").replace(/\//g, "_");
  const method = index != null ? "extract" : "raw";
  return `https://${process.env.FARSPARK_SERVER}/0/${method}/0/0/0/${index || 0}/${encodedUrl}`;
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

export const guessContentType = url => {
  if (url.startsWith("hubs://") && url.endsWith("/video")) return "video/vnd.hubs-webrtc";
  const extension = new URL(url).pathname.split(".").pop();
  return commonKnownContentTypes[extension];
};

export const upload = file => {
  const formData = new FormData();
  formData.append("media", file);
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
  entity.setAttribute("media-loader", { resize, resolve, src: typeof src === "string" ? src : "" });
  scene.appendChild(entity);

  const fireLoadingTimeout = setTimeout(() => {
    scene.emit("media-loading", { src: src });
  }, 100);

  ["model-loaded", "video-loaded", "image-loaded"].forEach(eventName => {
    entity.addEventListener(eventName, () => {
      clearTimeout(fireLoadingTimeout);

      if (!entity.classList.contains("pen")) {
        entity.object3D.scale.setScalar(0.5);
        entity.matrixNeedsUpdate = true;

        entity.setAttribute("animation__spawn-start", {
          property: "scale",
          delay: 50,
          dur: 300,
          from: { x: 0.5, y: 0.5, z: 0.5 },
          to: { x: 1.0, y: 1.0, z: 1.0 },
          easing: "easeOutElastic"
        });
      }

      scene.emit("media-loaded", { src: src });
    });
  });

  const orientation = new Promise(function(resolve) {
    if (src instanceof File) {
      getOrientation(src, x => {
        resolve(x);
      });
    } else {
      resolve(1);
    }
  });
  if (src instanceof File) {
    upload(src)
      .then(response => {
        const srcUrl = new URL(response.raw);
        srcUrl.searchParams.set("token", response.meta.access_token);
        entity.setAttribute("media-loader", { resolve: false, src: srcUrl.href });
      })
      .catch(() => {
        entity.setAttribute("media-loader", { src: "error" });
      });
  } else if (src instanceof MediaStream) {
    entity.setAttribute("media-loader", { src: `hubs://clients/${NAF.clientId}/video` });
  }

  if (contentOrigin) {
    entity.addEventListener("media_resolved", ({ detail }) => {
      const objectType = objectTypeForOriginAndContentType(contentOrigin, detail.contentType);
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
    if (!object.material || !validMaterials.includes(object.material.type)) {
      return;
    }

    // HACK, this routine inadvertently leaves the A-Frame shaders wired to the old, dark
    // material, so maps cannot be updated at runtime. This breaks UI elements who have
    // hover/toggle state, so for now just skip these while we figure out a more correct
    // solution.
    if (object.el.classList.contains("ui")) return;
    if (object.el.getAttribute("text-button")) return;

    object.material = object.material.clone();
    object.material.onBeforeCompile = shader => {
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

      shaderUniforms.set(object.material.uuid, shader.uniforms);
    };
    object.material.needsUpdate = true;
  });

  return shaderUniforms;
}
