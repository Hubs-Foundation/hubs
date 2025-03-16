import { objectTypeForOriginAndContentType } from "../object-types";
import { getReticulumFetchUrl, getDirectReticulumFetchUrl } from "./phoenix-utils";
import { ObjectContentOrigins } from "../object-types";
import mediaHighlightFrag from "./media-highlight-frag.glsl";
import { updateMaterials } from "./material-utils";
import HubsTextureLoader from "../loaders/HubsTextureLoader";
import { validMaterials } from "../components/hoverable-visuals";
import { isNonCorsProxyDomain, proxiedUrlFor, guessContentType } from "../utils/media-url-utils";
import { isIOS as detectIOS } from "./is-mobile";
import Linkify from "linkify-it";
import tlds from "tlds";
import { mediaTypeFor } from "./media-type";
import { MediaPlayer } from "dashjs";
import { buildAbsoluteURL } from "url-toolkit";
import HLS from "hls.js";
import configs from "../utils/configs";
import qsTruthy from "../utils/qs_truthy";

import anime from "animejs";

export const MediaType = {
  MODEL: 1 << 0,
  IMAGE: 1 << 1,
  VIDEO: 1 << 2,
  PDF: 1 << 3,
  HTML: 1 << 4,
  AUDIO: 1 << 5
};
MediaType.ALL = MediaType.MODEL | MediaType.IMAGE | MediaType.VIDEO | MediaType.PDF | MediaType.HTML | MediaType.AUDIO;
MediaType.ALL_2D = MediaType.IMAGE | MediaType.VIDEO | MediaType.PDF | MediaType.HTML;
const MediaTypeName = new Map([
  [MediaType.MODEL, "model"],
  [MediaType.IMAGE, "image"],
  [MediaType.VIDEO, "video"],
  [MediaType.PDF, "pdf"],
  [MediaType.HTML, "html"],
  [MediaType.AUDIO, "audio"]
]);
export function mediaTypeName(type) {
  return MediaTypeName.get(type) || "unknown";
}

const linkify = Linkify();
linkify.tlds(tlds);

const mediaAPIEndpoint = getReticulumFetchUrl("/api/v1/media");
const getDirectMediaAPIEndpoint = () => getDirectReticulumFetchUrl("/api/v1/media");

const isMobile = AFRAME.utils.device.isMobile();
const isThisMobileVR = AFRAME.utils.device.isMobileVR();

// Map<String, Promise<Object>
const resolveUrlCache = new Map();
export const getDefaultResolveQuality = (is360 = false) => {
  const useLowerQuality = isMobile || isThisMobileVR;
  return !is360 ? (useLowerQuality ? "low" : "high") : useLowerQuality ? "low_360" : "high_360";
};

export const resolveUrl = async (url, quality = null, version = 1, bustCache) => {
  const key = `${url}_${version}`;
  if (!bustCache && resolveUrlCache.has(key)) return resolveUrlCache.get(key);

  const resultPromise = fetch(mediaAPIEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media: { url, quality: quality || getDefaultResolveQuality() }, version })
  }).then(async response => {
    if (!response.ok) {
      const message = `Error resolving url "${url}":`;
      try {
        const body = await response.text();
        throw new Error(message + " " + body);
      } catch (e) {
        throw new Error(message + " " + response.statusText);
      }
    }
    return response.json();
  });

  resolveUrlCache.set(key, resultPromise);
  return resultPromise;
};

export const upload = (file, desiredContentType) => {
  const formData = new FormData();
  formData.append("media", file);
  formData.append("promotion_mode", "with_token");

  if (desiredContentType) {
    formData.append("desired_content_type", desiredContentType);
  }

  // To eliminate the extra hop and avoid proxy timeouts, upload files directly
  // to a reticulum host.
  return fetch(getDirectMediaAPIEndpoint(), {
    method: "POST",
    body: formData
  }).then(r => r.json());
};

// https://stackoverflow.com/questions/7584794/accessing-jpeg-exif-rotation-data-in-javascript-on-the-client-side/32490603#32490603
function getOrientation(file, callback) {
  const reader = new FileReader();
  reader.onload = function (e) {
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

function getLatestMediaVersionOfSrc(src) {
  const els = document.querySelectorAll("[media-loader]");
  let version = 1;

  for (const el of els) {
    const loader = el.components["media-loader"];

    if (loader.data && loader.data.src === src) {
      version = Math.max(version, loader.data.version);
    }
  }

  return version;
}

export function coerceToUrl(urlOrText) {
  if (!linkify.test(urlOrText)) return urlOrText;

  // See: https://github.com/Soapbox/linkifyjs/blob/master/src/linkify.js#L52
  return urlOrText.indexOf("://") >= 0 ? urlOrText : `https://${urlOrText}`;
}

export const addMedia = (
  src,
  template,
  contentOrigin,
  contentSubtype = null,
  resolve = false,
  fitToBox = false,
  animate = true,
  mediaOptions = {},
  networked = true,
  parentEl = null,
  linkedEl = null
) => {
  const scene = AFRAME.scenes[0];

  const entity = document.createElement("a-entity");

  const nid = NAF.utils.createNetworkId();
  if (networked) {
    entity.setAttribute("networked", { template: template, networkId: nid });
  } else {
    const templateBody = document
      .importNode(document.body.querySelector(template).content, true)
      .firstElementChild.cloneNode(true);
    const elAttrs = templateBody.attributes;

    // Merge root element attributes with this entity
    for (let attrIdx = 0; attrIdx < elAttrs.length; attrIdx++) {
      entity.setAttribute(elAttrs[attrIdx].name, elAttrs[attrIdx].value);
    }

    // Append all child elements
    while (templateBody.firstElementChild) {
      entity.appendChild(templateBody.firstElementChild);
    }
  }

  const needsToBeUploaded = src instanceof File;

  // If we're re-pasting an existing src in the scene, we should use the latest version
  // seen across any other entities. Otherwise, start with version 1.
  const version = getLatestMediaVersionOfSrc(src);

  entity.setAttribute("media-loader", {
    fitToBox,
    resolve,
    animate,
    src: typeof src === "string" ? coerceToUrl(src) || src : "",
    version,
    contentSubtype,
    fileIsOwned: !needsToBeUploaded,
    linkedEl,
    mediaOptions
  });

  entity.object3D.matrixNeedsUpdate = true;

  (parentEl || scene).appendChild(entity);

  const orientation = new Promise(function (resolve) {
    if (needsToBeUploaded) {
      getOrientation(src, x => {
        resolve(x);
      });
    } else {
      resolve(1);
    }
  });
  if (needsToBeUploaded) {
    // Video camera videos are converted to mp4 for compatibility
    const desiredContentType = contentSubtype === "video-camera" ? "video/mp4" : src.type || guessContentType(src.name);

    upload(src, desiredContentType)
      .then(response => {
        const srcUrl = new URL(proxiedUrlFor(response.origin));
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

export const cloneMedia = (sourceEl, template, src = null, networked = true, link = false, parentEl = null) => {
  if (!src) {
    ({ src } = sourceEl.components["media-loader"].data);
  }

  const { contentSubtype, fitToBox, mediaOptions } = sourceEl.components["media-loader"].data;

  return addMedia(
    src,
    template,
    ObjectContentOrigins.URL,
    contentSubtype,
    true,
    fitToBox,
    false,
    mediaOptions,
    networked,
    parentEl,
    link ? sourceEl : null
  );
};

export function injectCustomShaderChunks(obj) {
  const shaderUniforms = [];

  obj.traverse(object => {
    if (!object.material || object.isTroikaText) return;

    // TODO this does not really belong here
    object.reflectionProbeMode = "dynamic";

    updateMaterials(object, material => {
      if (material.hubs_InjectedCustomShaderChunks) return material;
      if (!validMaterials.includes(material.type)) {
        return material;
      }

      // HACK, this routine inadvertently leaves the A-Frame shaders wired to the old, dark
      // material, so maps cannot be updated at runtime. This breaks UI elements who have
      // hover/toggle state, so for now just skip these while we figure out a more correct
      // solution.
      if (
        object.el &&
        (object.el.classList.contains("ui") ||
          object.el.classList.contains("hud") ||
          object.el.getAttribute("text-button"))
      )
        return material;

      const newMaterial = material.clone();
      newMaterial.onBeforeRender = material.onBeforeRender;
      newMaterial.onBeforeCompile = (shader, renderer) => {
        if (shader.vertexShader.indexOf("#include <skinning_vertex>") == -1) return;

        if (material.onBeforeCompile) {
          material.onBeforeCompile(shader, renderer);
        }

        shader.uniforms.hubs_IsFrozen = { value: false };
        shader.uniforms.hubs_EnableSweepingEffect = { value: false };
        shader.uniforms.hubs_SweepParams = { value: [0, 0] };
        shader.uniforms.hubs_InteractorOnePos = { value: [0, 0, 0] };
        shader.uniforms.hubs_InteractorTwoPos = { value: [0, 0, 0] };
        shader.uniforms.hubs_HighlightInteractorOne = { value: false };
        shader.uniforms.hubs_HighlightInteractorTwo = { value: false };
        shader.uniforms.hubs_Time = { value: 0 };

        shader.vertexShader =
          [
            "varying vec3 hubs_WorldPosition;",
            "uniform bool hubs_IsFrozen;",
            "uniform bool hubs_HighlightInteractorOne;",
            "uniform bool hubs_HighlightInteractorTwo;\n"
          ].join("\n") +
          shader.vertexShader.replace(
            "#include <skinning_vertex>",
            `#include <skinning_vertex>
             if (hubs_HighlightInteractorOne || hubs_HighlightInteractorTwo || hubs_IsFrozen) {
              vec4 wt = modelMatrix * vec4(transformed, 1);

              // Used in the fragment shader below.
              hubs_WorldPosition = wt.xyz;
            }`
          );

        shader.fragmentShader =
          [
            "varying vec3 hubs_WorldPosition;",
            "uniform bool hubs_IsFrozen;",
            "uniform bool hubs_EnableSweepingEffect;",
            "uniform vec2 hubs_SweepParams;",
            "uniform bool hubs_HighlightInteractorOne;",
            "uniform vec3 hubs_InteractorOnePos;",
            "uniform bool hubs_HighlightInteractorTwo;",
            "uniform vec3 hubs_InteractorTwoPos;",
            "uniform float hubs_Time;\n"
          ].join("\n") +
          shader.fragmentShader.replace(
            "#include <output_fragment>",
            "#include <output_fragment>\n" + mediaHighlightFrag
          );

        shaderUniforms.push(shader.uniforms);
      };
      newMaterial.needsUpdate = true;
      newMaterial.hubs_InjectedCustomShaderChunks = true;
      return newMaterial;
    });
  });

  return shaderUniforms;
}

export function getPromotionTokenForFile(fileId) {
  return window.APP.store.state.uploadPromotionTokens.find(upload => upload.fileId === fileId);
}

const mediaPos = new THREE.Vector3();

export function addAndArrangeMedia(el, media, contentSubtype, snapCount, mirrorOrientation = false, distance = 0.75) {
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
    Math.cos(Math.PI * 2 * (idx / 6.0)) * distance,
    Math.sin(Math.PI * 2 * (idx / 6.0)) * distance,
    -0.05 + idx * 0.001
  );

  el.object3D.localToWorld(mediaPos);
  entity.object3D.visible = false;

  const handler = () => {
    entity.object3D.visible = true;
    entity.setAttribute("animation__photo_pos", {
      property: "position",
      dur: 800,
      from: { x: pos.x, y: pos.y, z: pos.z },
      to: { x: mediaPos.x, y: mediaPos.y, z: mediaPos.z },
      easing: "easeOutElastic"
    });
  };

  let eventType = null;

  if (contentSubtype.startsWith("photo")) {
    entity.addEventListener("image-loaded", handler, { once: true });
    eventType = "photo";
  } else if (contentSubtype.startsWith("video")) {
    entity.addEventListener("video-loaded", handler, { once: true });
    eventType = "video";
  } else {
    console.error("invalid type " + contentSubtype);
    return;
  }

  entity.object3D.matrixNeedsUpdate = true;

  entity.addEventListener(
    "media_resolved",
    () => {
      el.emit(`${eventType}_taken`, entity.components["media-loader"].data.src);
    },
    { once: true }
  );

  return { entity, orientation };
}

export const textureLoader = new HubsTextureLoader().setCrossOrigin("anonymous");

export async function createImageTexture(url, filter) {
  let texture;

  if (filter) {
    const image = new Image();
    image.crossOrigin = "anonymous";
    const load = new Promise(res => image.addEventListener("load", res, { once: true }));
    image.src = url;
    await load;
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    await filter(ctx, image.width, image.height);

    texture = new THREE.CanvasTexture(canvas);
  } else {
    try {
      texture = await textureLoader.loadAsync(url);
    } catch (e) {
      throw new Error(`'${url}' could not be fetched (Error code: ${e.status}; Response: ${e.statusText})`);
    }
  }

  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = 4;

  return texture;
}

const isIOS = detectIOS();

/**
 * Create video element to be used as a texture.
 *
 * @param {string} src - Url to a video file.
 * @returns {Element} Video element.
 */
export function createVideoOrAudioEl(type) {
  const el = document.createElement(type);
  el.setAttribute("playsinline", "");
  el.setAttribute("webkit-playsinline", "");
  // iOS Safari requires the autoplay attribute, or it won't play the video at all.
  el.autoplay = true;
  // iOS Safari will not play videos without user interaction. We mute the video so that it can autoplay and then
  // allow the user to unmute it with an interaction in the unmute-video-button component.
  el.muted = isIOS;
  el.preload = "auto";
  el.crossOrigin = "anonymous";
  // Audio should default to zero or it be heard before it is positioning and adjusted
  el.volume = 0;
  return el;
}

export function addMeshScaleAnimation(mesh, initialScale, onComplete) {
  const step = (function () {
    const lastValue = {};
    return function (anim) {
      const value = anim.animatables[0].target;

      value.x = Math.max(Number.MIN_VALUE, value.x);
      value.y = Math.max(Number.MIN_VALUE, value.y);
      value.z = Math.max(Number.MIN_VALUE, value.z);

      // For animation timeline.
      if (value.x === lastValue.x && value.y === lastValue.y && value.z === lastValue.z) {
        return;
      }

      lastValue.x = value.x;
      lastValue.y = value.y;
      lastValue.z = value.z;

      mesh.scale.set(value.x, value.y, value.z);
      mesh.matrixNeedsUpdate = true;
    };
  })();

  const config = {
    duration: 400,
    easing: "easeOutElastic",
    elasticity: 400,
    loop: 0,
    round: false,
    x: mesh.scale.x,
    y: mesh.scale.y,
    z: mesh.scale.z,
    targets: [initialScale],
    update: anim => step(anim),
    complete: anim => {
      step(anim);
      if (onComplete) onComplete();
    }
  };

  mesh.scale.copy(initialScale);
  mesh.matrixNeedsUpdate = true;

  return anime(config);
}

export function closeExistingMediaMirror() {
  const mirrorTarget = document.querySelector("#media-mirror-target");

  // Remove old mirror target media element
  if (mirrorTarget.firstChild) {
    mirrorTarget.firstChild.setAttribute("animation__remove", {
      property: "scale",
      dur: 200,
      to: { x: 0.01, y: 0.01, z: 0.01 },
      easing: "easeInQuad"
    });

    return new Promise(res => {
      mirrorTarget.firstChild.addEventListener("animationcomplete", () => {
        mirrorTarget.removeChild(mirrorTarget.firstChild);
        mirrorTarget.parentEl.object3D.visible = false;
        res();
      });
    });
  }
}

export function hasAudioTracks(el) {
  if (!el) return false;

  // `audioTracks` is the "correct" way to check this but is not implemented by most browsers
  // The rest of the checks are a bit of a race condition, but when loading videos we wait for
  // the first frame to load, so audio should exist by then. We special case audio-only by checkin
  // for a 0 size video. Not great...
  if (el.audioTracks !== undefined) {
    return el.audioTracks.length > 0;
  } else if (el.videoWidth === 0 && el.videoHeight === 0) {
    return true;
  } else if (el.mozHasAudio !== undefined) {
    return el.mozHasAudio;
  } else if (el.webkitAudioDecodedByteCount !== undefined) {
    return el.webkitAudioDecodedByteCount > 0;
  } else {
    return false;
  }
}

export function fetchContentType(url) {
  return fetch(url, { method: "HEAD" }).then(r => r.headers.get("content-type"));
}

export function parseURL(text) {
  let url;
  try {
    url = new URL(text);
  } catch (e) {
    try {
      url = new URL(`https://${text}`);
    } catch (e) {
      return null;
    }
  }
  return url;
}

export async function resolveMediaInfo(urlString) {
  // check if url is an anchor hash e.g. #Spawn_Point_1
  if (urlString.charAt(0) === "#") {
    urlString = `${window.location.origin}${window.location.pathname}${window.location.search}${urlString}`;
  }

  const url = parseURL(urlString);
  if (!url) {
    throw new Error(`Cannot fetch data for URL: ${urlString}`);
  }

  let canonicalUrl = url.href;
  let canonicalAudioUrl = null; // set non-null only if audio track is separated from video track (eg. 360 video)
  let contentType;
  let thumbnail;

  // We want to resolve and proxy some hubs urls, like rooms and scene links,
  // but want to avoid proxying assets in order for this to work in dev environments
  const isLocalModelAsset =
    isNonCorsProxyDomain(url.hostname) && (guessContentType(url.href) || "").startsWith("model/gltf");

  if (url.protocol != "data:" && url.protocol != "hubs:" && !isLocalModelAsset) {
    const response = await resolveUrl(url.href);
    canonicalUrl = response.origin;
    if (canonicalUrl.startsWith("//")) {
      canonicalUrl = `${location.protocol}${canonicalUrl}`;
    }

    canonicalAudioUrl = response.origin_audio;
    if (canonicalAudioUrl && canonicalAudioUrl.startsWith("//")) {
      canonicalAudioUrl = location.protocol + canonicalAudioUrl;
    }

    contentType = (response.meta && response.meta.expected_content_type) || contentType;
    thumbnail = response.meta && response.meta.thumbnail && proxiedUrlFor(response.meta.thumbnail);
  }

  const accessibleUrl = proxiedUrlFor(canonicalUrl);
  if (!contentType) {
    contentType = guessContentType(canonicalUrl) || (await fetchContentType(accessibleUrl));
  }

  // TODO we should probably just never return "application/octet-stream" as expectedContentType, since its not really useful
  if (contentType === "application/octet-stream") {
    contentType = guessContentType(canonicalUrl) || contentType;
  }

  // Some servers treat m3u8 playlists as "audio/x-mpegurl", we always want to treat them as HLS videos
  if (contentType === "audio/x-mpegurl" || contentType === "audio/mpegurl") {
    contentType = "application/vnd.apple.mpegurl";
  }

  const mediaType = mediaTypeFor(contentType, canonicalUrl);

  return {
    accessibleUrl,
    canonicalUrl,
    canonicalAudioUrl,
    contentType,
    mediaType,
    thumbnail
  };
}

export function createDashPlayer(url, videoEl, failLoad) {
  const player = MediaPlayer().create();
  player.extend("RequestModifier", function () {
    return { modifyRequestHeader: xhr => xhr, modifyRequestURL: proxiedUrlFor };
  });
  player.on(MediaPlayer.events.ERROR, failLoad);
  player.initialize(videoEl, url);
  player.setTextDefaultEnabled(false);

  // TODO this countinously pings to get updated time, unclear if this is actually needed, but this preserves the default behavior
  player.clearDefaultUTCTimingSources();
  player.addUTCTimingSource("urn:mpeg:dash:utc:http-xsdate:2014", proxiedUrlFor("https://time.akamai.com/?iso"));
  // We can also use our own HEAD request method like we use to sync NAF
  // dashPlayer.addUTCTimingSource("urn:mpeg:dash:utc:http-head:2014", location.href);
  return player;
}

export function createHLSPlayer(url, videoEl, failLoad) {
  const corsProxyPrefix = `https://${configs.CORS_PROXY_SERVER}/`;
  const baseUrl = url.startsWith(corsProxyPrefix) ? url.substring(corsProxyPrefix.length) : url;
  const hls = new HLS({
    debug: qsTruthy("hlsDebug"),
    xhrSetup: (xhr, u) => {
      if (u.startsWith(corsProxyPrefix)) {
        u = u.substring(corsProxyPrefix.length);
      }

      // HACK HLS.js resolves relative urls internally, but our CORS proxying screws it up. Resolve relative to the original unproxied url.
      // TODO extend HLS.js to allow overriding of its internal resolving instead
      if (!u.startsWith("http")) {
        u = buildAbsoluteURL(baseUrl, u.startsWith("/") ? u : `/${u}`);
      }

      xhr.open("GET", proxiedUrlFor(u), true);
    }
  });

  hls.loadSource(url);
  hls.attachMedia(videoEl);

  hls.on(HLS.Events.ERROR, function (event, data) {
    if (data.fatal) {
      switch (data.type) {
        case HLS.ErrorTypes.NETWORK_ERROR:
          // try to recover network error
          hls.startLoad();
          break;
        case HLS.ErrorTypes.MEDIA_ERROR:
          hls.recoverMediaError();
          break;
        default:
          failLoad(event);
          return;
      }
    }
  });

  return hls;
}
