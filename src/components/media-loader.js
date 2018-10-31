import { getBox, getScaleCoefficient } from "../utils/auto-box-collider";
import { guessContentType, proxiedUrlFor, resolveUrl } from "../utils/media-utils";
import { addAnimationComponents } from "../utils/animation";

import "three/examples/js/loaders/GLTFLoader";
import loadingObjectSrc from "../assets/LoadingObject_Atom.glb";

const gltfLoader = new THREE.GLTFLoader();
let loadingObject;
gltfLoader.load(loadingObjectSrc, gltf => {
  loadingObject = gltf;
});

const fetchContentType = url => {
  return fetch(url, { method: "HEAD" }).then(r => r.headers.get("content-type"));
};

const fetchMaxContentIndex = url => {
  return fetch(url).then(r => parseInt(r.headers.get("x-max-content-index")));
};

function injectCustomShaderChunks(obj) {
  const vertexRegex = /\bbegin_vertex\b/;
  const fragRegex = /\bgl_FragColor\b/;

  const materialsSeen = new Set();
  const shaderUniforms = [];

  obj.traverse(object => {
    if (!object.material || !["MeshStandardMaterial", "MeshBasicMaterial"].includes(object.material.type)) {
      return;
    }
    object.material = object.material.clone();
    object.material.onBeforeCompile = shader => {
      if (!vertexRegex.test(shader.vertexShader)) return;

      shader.uniforms.hubsInteractorOneTransform = { value: [] };
      shader.uniforms.hubsInteractorTwoTransform = { value: [] };
      shader.uniforms.hubsInteractorTwoPos = { value: [] };
      shader.uniforms.hubsHighlightInteractorOne = { value: false };
      shader.uniforms.hubsHighlightInteractorTwo = { value: false };
      shader.uniforms.hubsTime = { value: 0 };

      const vchunk = `
        if (hubsHighlightInteractorOne || hubsHighlightInteractorTwo) {
          vec4 wt = modelMatrix * vec4(transformed, 1);

          // Used in the fragment shader below.
          hubsWorldPosition = wt.xyz;
        }
      `;

      const vlines = shader.vertexShader.split("\n");
      const vindex = vlines.findIndex(line => vertexRegex.test(line));
      vlines.splice(vindex + 1, 0, vchunk);
      vlines.unshift("varying vec3 hubsWorldPosition;");
      vlines.unshift("uniform bool hubsHighlightInteractorOne;");
      vlines.unshift("uniform bool hubsHighlightInteractorTwo;");
      shader.vertexShader = vlines.join("\n");

      const fchunk = `
        if (hubsHighlightInteractorOne || hubsHighlightInteractorTwo) {
          mat4 it;
          vec3 ip;
          float dist1, dist2;

          if (hubsHighlightInteractorOne) {
            it = hubsInteractorOneTransform;
            ip = vec3(it[3][0], it[3][1], it[3][2]);
            dist1 = distance(hubsWorldPosition, ip);
          }

          if (hubsHighlightInteractorTwo) {
            it = hubsInteractorTwoTransform;
            ip = vec3(it[3][0], it[3][1], it[3][2]);
            dist2 = distance(hubsWorldPosition, ip);
          }

          float ratio = 0.0;
          float pulse = sin(hubsTime / 1000.0) + 1.0;
          float spacing = 0.5;
          float line = spacing * pulse - spacing / 2.0;
          float lineWidth= 0.01;
          float mody = mod(hubsWorldPosition.y, spacing);

          if (-lineWidth + line < mody && mody < lineWidth + line) {
            // Highlight with an animated line effect
            ratio = 0.5;
          } else {
            // Highlight with a gradient falling off with distance.
            if (hubsHighlightInteractorOne) {
              ratio = -min(1.0, pow(dist1 * (9.0 + 3.0 * pulse), 3.0)) + 1.0;
            } 
            if (hubsHighlightInteractorTwo) {
              ratio += -min(1.0, pow(dist2 * (9.0 + 3.0 * pulse), 3.0)) + 1.0;
            }
          }

          ratio = min(1.0, ratio);

          // Gamma corrected highlight color
          vec3 highlightColor = vec3(0.184, 0.499, 0.933);

          gl_FragColor.rgb = (gl_FragColor.rgb * (1.0 - ratio)) + (highlightColor * ratio);
        }
      `;

      const flines = shader.fragmentShader.split("\n");
      const findex = flines.findIndex(line => fragRegex.test(line));
      flines.splice(findex + 1, 0, fchunk);
      flines.unshift("varying vec3 hubsWorldPosition;");
      flines.unshift("uniform bool hubsHighlightInteractorOne;");
      flines.unshift("uniform mat4 hubsInteractorOneTransform;");
      flines.unshift("uniform bool hubsHighlightInteractorTwo;");
      flines.unshift("uniform mat4 hubsInteractorTwoTransform;");
      flines.unshift("uniform float hubsTime;");
      shader.fragmentShader = flines.join("\n");

      if (!materialsSeen.has(object.material.uuid)) {
        shaderUniforms.push(shader.uniforms);
        materialsSeen.add(object.material.uuid);
      }
    };
    object.material.needsUpdate = true;
  });

  return shaderUniforms;
}

AFRAME.registerComponent("media-loader", {
  schema: {
    src: { type: "string" },
    resize: { default: false },
    resolve: { default: false },
    contentType: { default: null }
  },

  init() {
    this.onError = this.onError.bind(this);
    this.showLoader = this.showLoader.bind(this);
    this.clearLoadingTimeout = this.clearLoadingTimeout.bind(this);
    this.onMediaLoaded = this.onMediaLoaded.bind(this);
    this.shapeAdded = false;
    this.hasBakedShapes = false;
  },

  setShapeAndScale(resize) {
    const mesh = this.el.getObject3D("mesh");
    const box = getBox(this.el, mesh);
    const scaleCoefficient = resize ? getScaleCoefficient(0.5, box) : 1;
    this.el.object3DMap.mesh.scale.multiplyScalar(scaleCoefficient);
    if (this.el.body && this.shapeAdded && this.el.body.shapes.length > 1) {
      this.el.removeAttribute("shape");
      this.shapeAdded = false;
    } else if (!this.hasBakedShapes) {
      const center = new THREE.Vector3();
      const { min, max } = box;
      const halfExtents = {
        x: (Math.abs(min.x - max.x) / 2) * scaleCoefficient,
        y: (Math.abs(min.y - max.y) / 2) * scaleCoefficient,
        z: (Math.abs(min.z - max.z) / 2) * scaleCoefficient
      };
      center.addVectors(min, max).multiplyScalar(0.5 * scaleCoefficient);
      mesh.position.sub(center);
      this.el.setAttribute("shape", {
        shape: "box",
        halfExtents: halfExtents
      });
      this.shapeAdded = true;
    }
  },

  tick(t, dt) {
    if (this.loaderMixer) {
      this.loaderMixer.update(dt / 1000);
    }
  },

  onError() {
    this.el.removeAttribute("gltf-model-plus");
    this.el.removeAttribute("media-pager");
    this.el.removeAttribute("media-video");
    this.el.setAttribute("media-image", { src: "error" });
    clearTimeout(this.showLoaderTimeout);
    delete this.showLoaderTimeout;
  },

  showLoader() {
    const useFancyLoader = !!loadingObject;
    const mesh = useFancyLoader
      ? loadingObject.scene.clone()
      : new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    if (useFancyLoader) {
      this.loaderMixer = new THREE.AnimationMixer(mesh);
      this.loadingClip = this.loaderMixer.clipAction(loadingObject.animations[0]);
      this.loadingClip.play();
    }
    this.el.setObject3D("mesh", mesh);
    this.hasBakedShapes = !!(this.el.body && this.el.body.shapes.length > 0);
    this.setShapeAndScale(true);
    delete this.showLoaderTimeout;
  },

  clearLoadingTimeout() {
    clearTimeout(this.showLoaderTimeout);
    if (this.loaderMixer) {
      this.loadingClip.stop();
      delete this.loaderMixer;
    }
    delete this.showLoaderTimeout;
  },

  onMediaLoaded() {
    this.clearLoadingTimeout();
    this.shaderUniforms = injectCustomShaderChunks(this.el.object3D);
  },

  async update(oldData) {
    try {
      const { src } = this.data;

      if (src !== oldData.src && !this.showLoaderTimeout) {
        this.showLoaderTimeout = setTimeout(this.showLoader, 100);
      }

      if (!src) return;

      let canonicalUrl = src;
      let accessibleUrl = src;
      let contentType = this.data.contentType;

      if (this.data.resolve) {
        const result = await resolveUrl(src);
        canonicalUrl = result.origin;
        contentType = (result.meta && result.meta.expected_content_type) || contentType;
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

      if (contentType.startsWith("video/") || contentType.startsWith("audio/")) {
        this.el.removeAttribute("gltf-model-plus");
        this.el.removeAttribute("media-image");
        this.el.addEventListener("video-loaded", this.onMediaLoaded, { once: true });
        this.el.setAttribute("media-video", { src: accessibleUrl });
        this.el.setAttribute("position-at-box-shape-border", { dirs: ["forward", "back"] });
      } else if (contentType.startsWith("image/")) {
        this.el.removeAttribute("gltf-model-plus");
        this.el.removeAttribute("media-video");
        this.el.addEventListener("image-loaded", this.onMediaLoaded, { once: true });
        this.el.removeAttribute("media-pager");
        this.el.setAttribute("media-image", { src: accessibleUrl, contentType });
        this.el.setAttribute("position-at-box-shape-border", { dirs: ["forward", "back"] });
      } else if (contentType.startsWith("application/pdf")) {
        this.el.removeAttribute("gltf-model-plus");
        this.el.removeAttribute("media-video");
        // two small differences:
        // 1. we pass the canonical URL to the pager so it can easily make subresource URLs
        // 2. we don't remove the media-image component -- media-pager uses that internally
        this.el.setAttribute("media-pager", { src: canonicalUrl });
        this.el.addEventListener("preview-loaded", this.onMediaLoaded, { once: true });
        this.el.setAttribute("position-at-box-shape-border", { dirs: ["forward", "back"] });
      } else if (
        contentType.includes("application/octet-stream") ||
        contentType.includes("x-zip-compressed") ||
        contentType.startsWith("model/gltf")
      ) {
        this.el.removeAttribute("media-image");
        this.el.removeAttribute("media-video");
        this.el.removeAttribute("media-pager");
        this.el.addEventListener(
          "model-loaded",
          () => {
            this.onMediaLoaded();
            this.hasBakedShapes = !!(this.el.body && this.el.body.shapes.length > (this.shapeAdded ? 1 : 0));
            this.setShapeAndScale(this.data.resize);
            addAnimationComponents(this.el);
          },
          { once: true }
        );
        this.el.addEventListener("model-error", this.onError, { once: true });
        this.el.setAttribute("gltf-model-plus", {
          src: accessibleUrl,
          contentType: contentType,
          inflate: true
        });
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
    src: { type: "string" },
    index: { default: 0 }
  },

  init() {
    this.toolbar = null;
    this.onNext = this.onNext.bind(this);
    this.onPrev = this.onPrev.bind(this);
    this.el.addEventListener("image-loaded", async e => {
      // unfortunately, since we loaded the page image in an img tag inside media-image, we have to make a second
      // request for the same page to read out the max-content-index header
      this.maxIndex = await fetchMaxContentIndex(e.detail.src);
      // if this is the first image we ever loaded, set up the UI
      if (this.toolbar == null) {
        const template = document.getElementById("paging-toolbar");
        this.el.appendChild(document.importNode(template.content, true));
        this.toolbar = this.el.querySelector(".paging-toolbar");
        // we have to wait a tick for the attach callbacks to get fired for the elements in a template
        setTimeout(() => {
          this.nextButton = this.el.querySelector(".next-button [text-button]");
          this.prevButton = this.el.querySelector(".prev-button [text-button]");
          this.pageLabel = this.el.querySelector(".page-label");

          this.nextButton.addEventListener("click", this.onNext);
          this.prevButton.addEventListener("click", this.onPrev);

          this.update();
          this.el.emit("preview-loaded");
        }, 0);
      } else {
        this.update();
      }
    });
  },

  update() {
    if (!this.data.src) return;
    const pageSrc = proxiedUrlFor(this.data.src, this.data.index);
    this.el.setAttribute("media-image", { src: pageSrc, contentType: "image/png" });
    if (this.pageLabel) {
      this.pageLabel.setAttribute("text", "value", `${this.data.index + 1}/${this.maxIndex + 1}`);
      this.repositionToolbar();
    }
  },

  remove() {
    if (this.toolbar) {
      this.el.removeChild(this.toolbar);
    }
  },

  onNext() {
    this.el.setAttribute("media-pager", "index", Math.min(this.data.index + 1, this.maxIndex));
  },

  onPrev() {
    this.el.setAttribute("media-pager", "index", Math.max(this.data.index - 1, 0));
  },

  repositionToolbar() {
    this.toolbar.object3D.position.y = -this.el.getAttribute("shape").halfExtents.y - 0.2;
  }
});
