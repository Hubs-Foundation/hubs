import { disposeTexture } from "../utils/material-utils";
import { createVideoOrAudioEl } from "../utils/media-utils";
import { findNode } from "../utils/three-utils";
import { Layers } from "../camera-layers";

/**
 * @component video-texture-source
 * This component is intended to be used on entities with a Camera Object3D as a child.
 * That camera is used to render the scene to a WebGLRenderTarget of the specified resolution
 * at a maximum of the specified frame rate. It will only render a frame if something sets
 * its textureNeedsUpdate property to true. Currently video-texture-target does this
 * whenever its material is used during the primary camera render (as in, it's in view).
 */
AFRAME.registerComponent("video-texture-source", {
  schema: {
    resolution: { type: "vec2", default: [1280, 720] },
    fps: { default: 15 }
  },

  init() {
    this.camera = findNode(this.el.object3D, n => n.isCamera);

    if (!this.camera) {
      console.warn("video-texture-source added to an entity without a camera");
      return;
    }

    this.camera.layers.enable(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);
    this.camera.layers.enable(Layers.CAMERA_LAYER_FX_MASK);

    this.camera.aspect = this.data.resolution[0] / this.data.resolution[1];

    // TODO currently if a video-texture-source tries to render itself it will fail with a warning.
    // If we want to support this we will need 2 render targets to swap back and forth.
    this.renderTarget = new THREE.WebGLRenderTarget(this.data.resolution[0], this.data.resolution[1], {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      encoding: THREE.sRGBEncoding
    });

    const texture = this.renderTarget.texture;

    // Since we are rendering directly to a texture we need to flip it vertically
    // See https://github.com/Hubs-Foundation/hubs/pull/4126#discussion_r610120237
    texture.matrixAutoUpdate = false;
    texture.matrix.scale(1, -1);
    texture.matrix.translate(0, 1);

    this.textureNeedsUpdate = false;
  },

  remove() {
    disposeTexture(this.renderTarget.texture);
    this.renderTarget.dispose();
  },

  tock(time) {
    if (!this.renderTarget || !this.textureNeedsUpdate) return;

    if (time < this.lastRenderTime + 1000 / this.data.fps) return;

    // TODO handle hiding UI and showing first person head
    // Once thats done also rework camrea-tool to use this to do its actual rendering

    const sceneEl = this.el.sceneEl;
    const renderer = this.renderer || sceneEl.renderer;

    const tmpXRFlag = renderer.xr.enabled;
    const tmpOnAfterRender = sceneEl.object3D.onAfterRender;
    delete sceneEl.object3D.onAfterRender;
    renderer.xr.enabled = false;

    // The entire scene graph matrices should already be updated
    // in tick(). They don't need to be recomputed again in tock().
    const tmpAutoUpdate = sceneEl.object3D.autoUpdate;
    sceneEl.object3D.autoUpdate = false;

    renderer.setRenderTarget(this.renderTarget);
    renderer.clearDepth();
    renderer.render(sceneEl.object3D, this.camera);
    renderer.setRenderTarget(null);

    sceneEl.object3D.autoUpdate = tmpAutoUpdate;

    renderer.xr.enabled = tmpXRFlag;
    sceneEl.object3D.onAfterRender = tmpOnAfterRender;

    this.lastRenderTime = time;
    this.textureNeedsUpdate = false;
  }
});

/**
 * @component video-texture-target
 * This component is intended to be used on entities with a mesh/skinned mesh Object3D
 * The component swaps the base color map on the mesh's material with a video texture
 * Currently the video texture can come from a webcam stream or a camera entity with
 * a video-texture-src component on it.
 */
AFRAME.registerComponent("video-texture-target", {
  schema: {
    src: { type: "string" },
    // only used when `src` === "el"
    srcEl: { type: "selector" },
    targetBaseColorMap: { type: "boolean", default: true },
    targetEmissiveMap: { type: "boolean", default: false }
  },

  getMaterial() {
    return (
      (this.el.object3DMap.skinnedmesh && this.el.object3DMap.skinnedmesh.material) ||
      (this.el.object3DMap.mesh && this.el.object3DMap.mesh.material) ||
      this.el.object3D.material
    );
  },

  init() {
    // Make video-texture-target objects inivisible before rendering to the frame buffer
    // Chromium checks for loops when drawing to a framebuffer so if we don't exclude the objects
    // that are using that rendertarget's texture we get an error. Firefox does not check.
    // https://chromium.googlesource.com/chromium/src/+/460cac969e2e9ac38a2611be1a32db0361d88bfb/gpu/command_buffer/service/gles2_cmd_decoder.cc#9516
    this.el.object3D.traverse(o => {
      o.layers.mask1 = o.layers.mask;
      o.layers.set(Layers.CAMERA_LAYER_VIDEO_TEXTURE_TARGET);
    });

    const material = this.getMaterial();

    if (!material) {
      console.warn("video-texture-target added to an entity without a material");
    }

    this.originalMap = material && material.map;
    this.originalEmissiveMap = material && material.emissiveMap;
  },

  update(prevData) {
    const material = this.getMaterial();

    if (!material) {
      return;
    }

    const src = this.data.src;

    // TODO it's pretty ugly to have these 2 unrelated code paths, it should probably be reworked such that both paths look more like the first branch
    if (src === "el") {
      if (prevData.srcEl === this.data.srcEl) return;

      if (this.data.srcEl) {
        const videoTextureSource = this.data.srcEl.components["video-texture-source"];
        const texture = videoTextureSource.renderTarget.texture;
        this.applyTexture(texture);

        // Only update the renderTarget when the screens are in view
        material.onBeforeRender = () => {
          videoTextureSource.textureNeedsUpdate = true;
        };
      } else {
        material.map = this.originalMap;
        material.emissiveMap = this.originalEmissiveMap;
        material.needsUpdate = true;
      }
    } else {
      if (src && src.startsWith("hubs://")) {
        if (prevData.src === src) {
          return;
        }

        const streamClientId = src.substring(7).split("/")[1]; // /clients/<client id>/video is only URL for now

        APP.dialog.getMediaStream(streamClientId, "video").then(stream => {
          if (src !== this.data.src) {
            // Prevent creating and loading video texture if the src changed while we were fetching the video stream.
            return;
          }

          const video = createVideoOrAudioEl("video");
          video.srcObject = stream;
          // Video is muted so autoplay is allowed
          video.play();

          const texture = new THREE.VideoTexture(video);
          texture.flipY = false;
          texture.minFilter = THREE.LinearFilter;
          texture.encoding = THREE.sRGBEncoding;

          this.applyTexture(texture);
        });
      } else {
        if (material.map && material.map !== this.originalMap) {
          disposeTexture(material.map);
        }

        if (material.emissiveMap && material.emissiveMap !== this.originalEmissiveMap) {
          disposeTexture(material.emissiveMap);
        }

        material.map = this.originalMap;
        material.emissiveMap = this.originalEmissiveMap;

        material.needsUpdate = true;
      }
    }
  },

  applyTexture(texture) {
    const material = this.getMaterial();

    // Copy texture settings from the original texture so that things like texture wrap settings are applied
    const originalTexture = this.originalMap || this.originalEmissiveMap;

    if (originalTexture) {
      texture.wrapS = originalTexture.wrapS;
      texture.wrapT = originalTexture.wrapT;
    }

    if (this.data.targetBaseColorMap) {
      material.map = texture;
    }

    if (this.data.targetEmissiveMap) {
      material.emissiveMap = texture;
    }

    material.needsUpdate = true;
  },

  remove() {
    this.el.object3D.traverse(o => {
      if (o.layers.mask1) {
        o.layers.mask = o.layers.mask1;
        delete o.layers.mask1;
      }
    });

    // element sources can be shared and are expected to manage their own resources
    if (this.data.src === "el") return;

    const material = this.getMaterial();

    if (material && material.map && material.map !== this.originalMap) {
      disposeTexture(material.map);
    }

    if (material.emissiveMap && material.emissiveMap !== this.originalEmissiveMap) {
      disposeTexture(material.emissiveMap);
    }
  }
});
