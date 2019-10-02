import { getBox, getScaleCoefficient } from "../utils/auto-box-collider";
import { resolveUrl, injectCustomShaderChunks, addMeshScaleAnimation } from "../utils/media-utils";
import {
  isNonCorsProxyDomain,
  guessContentType,
  proxiedUrlFor,
  isHubsRoomUrl,
  isHubsSceneUrl,
  isHubsAvatarUrl
} from "../utils/media-url-utils";
import { addAnimationComponents } from "../utils/animation";
import qsTruthy from "../utils/qs_truthy";

import loadingObjectSrc from "../assets/models/LoadingObject_Atom.glb";
import { SOUND_MEDIA_LOADING, SOUND_MEDIA_LOADED } from "../systems/sound-effects-system";
import { loadModel } from "./gltf-model-plus";
import { cloneObject3D } from "../utils/three-utils";
import { waitForDOMContentLoaded } from "../utils/async-utils";

import { SHAPE } from "three-ammo/constants";

let loadingObjectEnvMap;
let loadingObject;

waitForDOMContentLoaded().then(() => {
  loadModel(loadingObjectSrc).then(gltf => {
    loadingObject = gltf;
  });
});

const fetchContentType = url => {
  return fetch(url, { method: "HEAD" }).then(r => r.headers.get("content-type"));
};

const boundingBox = new THREE.Box3();

const batchMeshes = qsTruthy("batchMeshes");
const disableBatching = qsTruthy("disableBatching");

AFRAME.registerComponent("media-loader", {
  schema: {
    playSoundEffect: { default: true },
    fileId: { type: "string" },
    fileIsOwned: { type: "boolean" },
    src: { type: "string" },
    resize: { default: false },
    resolve: { default: false },
    contentType: { default: null },
    contentSubtype: { default: null },
    animate: { default: true },
    mediaOptions: {
      default: {},
      parse: v => (typeof v === "object" ? v : JSON.parse(v)),
      stringify: JSON.stringify
    }
  },

  init() {
    this.onError = this.onError.bind(this);
    this.showLoader = this.showLoader.bind(this);
    this.clearLoadingTimeout = this.clearLoadingTimeout.bind(this);
    this.onMediaLoaded = this.onMediaLoaded.bind(this);
    this.animating = false;

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.networkedEl = networkedEl;
    });
  },

  updateScale: (function() {
    const center = new THREE.Vector3();
    return function(resize) {
      const mesh = this.el.getObject3D("mesh");
      const box = getBox(this.el, mesh);
      const scaleCoefficient = resize ? getScaleCoefficient(0.5, box) : 1;
      mesh.scale.multiplyScalar(scaleCoefficient);
      const { min, max } = box;
      center.addVectors(min, max).multiplyScalar(0.5 * scaleCoefficient);
      mesh.position.sub(center);
      mesh.matrixNeedsUpdate = true;

      // Tridify code
      // Hacky way to disable item rescaling
      mesh.scale.x = 1;
      mesh.scale.y = 1;
      mesh.scale.z = 1;
    };
  })(),

  removeShape(id) {
    if (this.el.getAttribute("shape-helper__" + id)) {
      this.el.removeAttribute("shape-helper__" + id);
    }
  },

  tick(t, dt) {
    if (this.loaderMixer) {
      this.loaderMixer.update(dt / 1000);
    }
  },

  remove() {
    if (this.loadingSoundNode) {
      this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.stopSoundNode(this.loadingSoundNode);
      this.loadingSoundNode = null;
    }
  },

  onError() {
    this.el.removeAttribute("gltf-model-plus");
    this.el.removeAttribute("media-pager");
    this.el.removeAttribute("media-video");
    this.el.removeAttribute("media-pdf");
    this.el.setAttribute("media-image", { src: "error" });
    this.clearLoadingTimeout();
  },

  showLoader() {
    if (this.el.object3DMap.mesh) {
      this.clearLoadingTimeout();
      return;
    }
    const useFancyLoader = !!loadingObject;

    const mesh = useFancyLoader
      ? cloneObject3D(loadingObject.scene)
      : new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    this.el.setObject3D("mesh", mesh);

    this.updateScale(true);

    if (useFancyLoader) {
      const environmentMapComponent = this.el.sceneEl.components["environment-map"];
      if (environmentMapComponent) {
        const currentEnivronmentMap = environmentMapComponent.environmentMap;
        if (loadingObjectEnvMap !== currentEnivronmentMap) {
          environmentMapComponent.applyEnvironmentMap(mesh);
          loadingObjectEnvMap = currentEnivronmentMap;
        }
      }

      this.loaderMixer = new THREE.AnimationMixer(mesh);

      this.loadingClip = this.loaderMixer.clipAction(mesh.animations[0]);
      this.loadingScaleClip = this.loaderMixer.clipAction(
        new THREE.AnimationClip(null, 1000, [
          new THREE.VectorKeyframeTrack(".scale", [0, 0.2], [0, 0, 0, mesh.scale.x, mesh.scale.y, mesh.scale.z])
        ])
      );
      setTimeout(() => {
        if (!this.loaderMixer) return; // Animation/loader was stopped early
        this.el.setAttribute("shape-helper__loader", { type: SHAPE.BOX });
      }, 200);

      this.loadingClip.play();
      this.loadingScaleClip.play();
    }

    if (
      this.el.sceneEl.is("entered") &&
      (!this.networkedEl || NAF.utils.isMine(this.networkedEl)) &&
      this.data.playSoundEffect
    ) {
      this.loadingSoundNode = this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundLooped(
        SOUND_MEDIA_LOADING
      );
    }

    delete this.showLoaderTimeout;
  },

  clearLoadingTimeout() {
    clearTimeout(this.showLoaderTimeout);
    if (this.loadingSoundNode) {
      this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.stopSoundNode(this.loadingSoundNode);
      this.loadingSoundNode = null;
    }
    if (this.loaderMixer) {
      this.loadingClip.stop();
      this.loadingScaleClip.stop();
      delete this.loaderMixer;
      delete this.loadingScaleClip;
      delete this.loadingClip;
    }
    delete this.showLoaderTimeout;
    this.removeShape("loader");
  },

  updateHoverableVisuals() {
    const hoverableVisuals = this.el.components["hoverable-visuals"];

    if (hoverableVisuals) {
      if (!this.injectedCustomShaderChunks) {
        this.injectedCustomShaderChunks = true;
        hoverableVisuals.uniforms = injectCustomShaderChunks(this.el.object3D);
      }

      boundingBox.setFromObject(this.el.object3DMap.mesh);
      boundingBox.getBoundingSphere(hoverableVisuals.boundingSphere);
    }
  },

  onMediaLoaded(physicsShape = null, shouldUpdateScale) {
    const el = this.el;
    this.clearLoadingTimeout();

    if (this.el.sceneEl.is("entered") && this.data.playSoundEffect) {
      this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_MEDIA_LOADED);
    }

    const finish = () => {
      this.animating = false;

      if (physicsShape) {
        el.setAttribute("shape-helper", {
          type: physicsShape,
          minHalfExtent: 0.04
        });
      }

      this.updateHoverableVisuals();

      const pager = el.components["media-pager"];

      if (pager) {
        pager.repositionToolbar();
      }
    };

    if (this.data.animate) {
      if (!this.animating) {
        this.animating = true;
        if (shouldUpdateScale) this.updateScale(this.data.resize);
        const mesh = this.el.getObject3D("mesh");
        const scale = { x: 0.001, y: 0.001, z: 0.001 };
        scale.x = mesh.scale.x < scale.x ? mesh.scale.x * 0.001 : scale.x;
        scale.y = mesh.scale.y < scale.y ? mesh.scale.x * 0.001 : scale.y;
        scale.z = mesh.scale.z < scale.z ? mesh.scale.x * 0.001 : scale.z;
        addMeshScaleAnimation(mesh, scale, finish);
      }
    } else {
      if (shouldUpdateScale) this.updateScale(this.data.resize);
      finish();
    }
  },

  async update(oldData) {
    try {
      const { src, contentSubtype } = this.data;

      if (src !== oldData.src && !this.showLoaderTimeout) {
        this.showLoaderTimeout = setTimeout(this.showLoader, 100);
      }

      if (!src) return;

      let canonicalUrl = src;
      let accessibleUrl = src;
      let contentType = this.data.contentType;
      let thumbnail;

      const parsedUrl = new URL(src);

      // We want to resolve and proxy some hubs urls, like rooms and scene links,
      // but want to avoid proxying assets in order for this to work in dev environments
      const isLocalModelAsset =
        isNonCorsProxyDomain(parsedUrl.hostname) && (guessContentType(src) || "").startsWith("model/gltf");

      if (this.data.resolve && !src.startsWith("data:") && !isLocalModelAsset) {
        const result = await resolveUrl(src);
        canonicalUrl = result.origin;
        // handle protocol relative urls
        if (canonicalUrl.startsWith("//")) {
          canonicalUrl = location.protocol + canonicalUrl;
        }
        contentType = (result.meta && result.meta.expected_content_type) || contentType;
        thumbnail = result.meta && result.meta.thumbnail && proxiedUrlFor(result.meta.thumbnail);
      }

      // todo: we don't need to proxy for many things if the canonical URL has permissive CORS headers
      accessibleUrl = proxiedUrlFor(canonicalUrl);

      // if the component creator didn't know the content type, we didn't get it from reticulum, and
      // we don't think we can infer it from the extension, we need to make a HEAD request to find it out
      contentType = contentType || guessContentType(canonicalUrl) || (await fetchContentType(accessibleUrl));

      // We don't want to emit media_resolved for index updates.
      if (src !== oldData.src) {
        this.el.emit("media_resolved", { src, raw: accessibleUrl, contentType });
      }

      if (
        contentType.startsWith("video/") ||
        contentType.startsWith("audio/") ||
        AFRAME.utils.material.isHLS(canonicalUrl, contentType)
      ) {
        const qsTime = parseInt(parsedUrl.searchParams.get("t"));
        const hashTime = parseInt(new URLSearchParams(parsedUrl.hash.substring(1)).get("t"));
        const startTime = hashTime || qsTime || 0;
        this.el.removeAttribute("gltf-model-plus");
        this.el.removeAttribute("media-image");
        this.el.removeAttribute("media-pdf");
        this.el.setAttribute("floaty-object", { reduceAngularFloat: true, releaseGravity: -1 });
        this.el.addEventListener(
          "video-loaded",
          e => {
            this.onMediaLoaded(e.detail.projection === "flat" ? SHAPE.BOX : null);
          },
          { once: true }
        );
        this.el.setAttribute(
          "media-video",
          Object.assign({}, this.data.mediaOptions, { src: accessibleUrl, time: startTime, contentType })
        );
        if (this.el.components["position-at-box-shape-border__freeze"]) {
          this.el.setAttribute("position-at-box-shape-border__freeze", { dirs: ["forward", "back"] });
        }
      } else if (contentType.startsWith("image/")) {
        this.el.removeAttribute("gltf-model-plus");
        this.el.removeAttribute("media-video");
        this.el.removeAttribute("media-pdf");
        this.el.removeAttribute("media-pager");
        this.el.addEventListener(
          "image-loaded",
          e => {
            this.onMediaLoaded(e.detail.projection === "flat" ? SHAPE.BOX : null);

            if (contentSubtype === "photo-camera") {
              this.el.setAttribute("hover-menu__photo", {
                template: "#photo-hover-menu",
                dirs: ["forward", "back"]
              });
            }
          },
          { once: true }
        );
        this.el.setAttribute("floaty-object", { reduceAngularFloat: true, releaseGravity: -1 });
        this.el.setAttribute(
          "media-image",
          Object.assign({}, this.data.mediaOptions, { src: accessibleUrl, contentType, batch: !disableBatching })
        );

        if (this.el.components["position-at-box-shape-border__freeze"]) {
          this.el.setAttribute("position-at-box-shape-border__freeze", { dirs: ["forward", "back"] });
        }
      } else if (contentType.startsWith("application/pdf")) {
        this.el.removeAttribute("gltf-model-plus");
        this.el.removeAttribute("media-video");
        this.el.removeAttribute("media-image");
        this.el.setAttribute(
          "media-pdf",
          Object.assign({}, this.data.mediaOptions, {
            src: accessibleUrl,
            contentType,
            batch: false // Batching disabled until atlas is updated properly
          })
        );
        this.el.setAttribute("media-pager", {});
        this.el.setAttribute("floaty-object", { reduceAngularFloat: true, releaseGravity: -1 });
        this.el.addEventListener(
          "pdf-loaded",
          () => {
            this.clearLoadingTimeout();
            this.onMediaLoaded(SHAPE.BOX);
          },
          { once: true }
        );

        if (this.el.components["position-at-box-shape-border__freeze"]) {
          this.el.setAttribute("position-at-box-shape-border__freeze", { dirs: ["forward", "back"] });
        }
      } else if (
        contentType.includes("application/octet-stream") ||
        contentType.includes("x-zip-compressed") ||
        contentType.startsWith("model/gltf")
      ) {
        this.el.removeAttribute("media-image");
        this.el.removeAttribute("media-video");
        this.el.removeAttribute("media-pdf");
        this.el.removeAttribute("media-pager");
        this.el.addEventListener(
          "model-loaded",
          () => {
            this.onMediaLoaded(SHAPE.HULL, true);
            addAnimationComponents(this.el);
          },
          { once: true }
        );
        this.el.addEventListener("model-error", this.onError, { once: true });
        this.el.setAttribute(
          "gltf-model-plus",
          Object.assign({}, this.data.mediaOptions, {
            src: accessibleUrl,
            contentType: contentType,
            inflate: true,
            batch: !disableBatching && batchMeshes,
            modelToWorldScale: this.data.resize ? 0.0001 : 1.0
          })
        );
      } else if (contentType.startsWith("text/html")) {
        this.el.removeAttribute("gltf-model-plus");
        this.el.removeAttribute("media-video");
        this.el.removeAttribute("media-pdf");
        this.el.removeAttribute("media-pager");
        this.el.addEventListener(
          "image-loaded",
          () => {
            const mayChangeScene = this.el.sceneEl.systems.permissions.can("update_hub");

            if (isHubsAvatarUrl(src)) {
              this.el.setAttribute("hover-menu__hubs-item", {
                template: "#avatar-link-hover-menu",
                dirs: ["forward", "back"]
              });
            } else if (isHubsRoomUrl(src) || (isHubsSceneUrl(src) && mayChangeScene)) {
              this.el.setAttribute("hover-menu__hubs-item", {
                template: "#hubs-destination-hover-menu",
                dirs: ["forward", "back"]
              });
            } else {
              this.el.setAttribute("hover-menu__link", { template: "#link-hover-menu", dirs: ["forward", "back"] });
            }
            this.onMediaLoaded(SHAPE.BOX);
          },
          { once: true }
        );
        this.el.setAttribute("floaty-object", { reduceAngularFloat: true, releaseGravity: -1 });
        this.el.setAttribute(
          "media-image",
          Object.assign({}, this.data.mediaOptions, {
            src: thumbnail,
            contentType: guessContentType(thumbnail) || "image/png",
            batch: !disableBatching
          })
        );
        if (this.el.components["position-at-box-shape-border__freeze"]) {
          this.el.setAttribute("position-at-box-shape-border__freeze", { dirs: ["forward", "back"] });
        }
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
    } catch (e) {
      console.error("Error adding media", e);
      this.onError();
    }
  }
});

AFRAME.registerComponent("media-pager", {
  schema: {
    index: { default: 0 },
    maxIndex: { default: 0 }
  },

  init() {
    this.toolbar = null;
    this.onNext = this.onNext.bind(this);
    this.onPrev = this.onPrev.bind(this);

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.networkedEl = networkedEl;
    });

    this.el.addEventListener("pdf-loaded", async () => {
      await this._ensureUI();
      this.update();
    });
  },

  async _ensureUI() {
    if (this.hasSetupUI) return;
    if (!this.data.maxIndex) return;

    this.hasSetupUI = true;

    // unfortunately, since we loaded the page image in an img tag inside media-image, we have to make a second
    // request for the same page to read out the max-content-index header
    const template = document.getElementById("paging-toolbar");
    this.el.querySelector(".interactable-ui").appendChild(document.importNode(template.content, true));
    this.toolbar = this.el.querySelector(".paging-toolbar");
    // we have to wait a tick for the attach callbacks to get fired for the elements in a template
    setTimeout(() => {
      this.nextButton = this.el.querySelector(".next-button [text-button]");
      this.prevButton = this.el.querySelector(".prev-button [text-button]");
      this.pageLabel = this.el.querySelector(".page-label");

      this.nextButton.object3D.addEventListener("interact", this.onNext);
      this.prevButton.object3D.addEventListener("interact", this.onPrev);

      this.update();
      this.el.emit("pager-loaded");
    }, 0);
  },

  async update() {
    await this._ensureUI();

    if (this.pageLabel) {
      this.pageLabel.setAttribute("text", "value", `${this.data.index + 1}/${this.data.maxIndex + 1}`);
      this.repositionToolbar();
    }
  },

  remove() {
    if (this.toolbar) {
      this.toolbar.parentNode.removeChild(this.toolbar);
    }
  },

  onNext() {
    if (!NAF.utils.isMine(this.networkedEl) && !NAF.utils.takeOwnership(this.networkedEl)) return;
    const newIndex = Math.min(this.data.index + 1, this.data.maxIndex);
    this.el.setAttribute("media-pdf", "index", newIndex);
    this.el.setAttribute("media-pager", "index", newIndex);
    this.el.emit("pager-page-changed");
  },

  onPrev() {
    if (!NAF.utils.isMine(this.networkedEl) && !NAF.utils.takeOwnership(this.networkedEl)) return;
    const newIndex = Math.max(this.data.index - 1, 0);
    this.el.setAttribute("media-pdf", "index", newIndex);
    this.el.setAttribute("media-pager", "index", newIndex);
    this.el.emit("pager-page-changed");
  },

  repositionToolbar() {
    const ammoShape = this.el.getAttribute("shape-helper");
    if (!ammoShape) return;
    if (!this.toolbar) return;

    this.toolbar.object3D.position.y = 0.7;
    this.toolbar.object3D.matrixNeedsUpdate = true;
  }
});
