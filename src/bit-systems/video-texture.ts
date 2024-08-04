import { defineQuery, enterQuery, entityExists, exitQuery, removeComponent } from "bitecs";
import {
  Camera,
  LinearFilter,
  Material,
  MeshStandardMaterial,
  NearestFilter,
  PerspectiveCamera,
  RGBAFormat,
  sRGBEncoding,
  Texture,
  WebGLRenderTarget
} from "three";
import { HubsWorld } from "../app";
import { MaterialTag, VideoTextureSource, VideoTextureTarget } from "../bit-components";
import { Layers } from "../camera-layers";
import { VIDEO_TEXTURE_TARGET_FLAGS } from "../inflators/video-texture-target";
import { EntityID } from "../utils/networking-types";
import { findNode } from "../utils/three-utils";

interface SourceData {
  renderTarget: WebGLRenderTarget;
  camera: EntityID;
  lastUpdated: number;
  needsUpdate: boolean;
}

interface TargetData {
  originalMap: Texture | null;
  originalEmissiveMap: Texture | null;
  originalBeforeRender: typeof Material.prototype.onBeforeRender;
  boundTo: EntityID;
}

function noop() {}

export function updateRenderTarget(world: HubsWorld, renderTarget: WebGLRenderTarget, camera: EntityID) {
  const sceneEl = AFRAME.scenes[0];
  const renderer = AFRAME.scenes[0].renderer;

  const tmpVRFlag = renderer.xr.enabled;
  renderer.xr.enabled = false;

  // TODO we are doing this because aframe uses this hook for tock.
  // Namely to capture what camera was rendering. We don't actually use that in any of our tocks.
  // Also tock can likely go away as a concept since we can just direclty order things after render in raf if we want to.
  const tmpOnAfterRender = sceneEl.object3D.onAfterRender;
  sceneEl.object3D.onAfterRender = noop;

  const bubbleSystem = AFRAME.scenes[0].systems["personal-space-bubble"];
  const boneVisibilitySystem = AFRAME.scenes[0].systems["hubs-systems"].boneVisibilitySystem;

  if (bubbleSystem) {
    for (let i = 0, l = bubbleSystem.invaders.length; i < l; i++) {
      bubbleSystem.invaders[i].disable();
    }
    // HACK, bone visibility typically takes a tick to update, but since we want to be able
    // to have enable() and disable() be reflected this frame, we need to do it immediately.
    boneVisibilitySystem.tick();
    // scene.autoUpdate will be false so explicitly update the world matrices
    boneVisibilitySystem.updateMatrices();
  }

  const tmpRenderTarget = renderer.getRenderTarget();
  renderer.setRenderTarget(renderTarget);
  renderer.clearDepth();
  renderer.render(sceneEl.object3D, world.eid2obj.get(camera)! as Camera);
  renderer.setRenderTarget(tmpRenderTarget);

  renderer.xr.enabled = tmpVRFlag;
  sceneEl.object3D.onAfterRender = tmpOnAfterRender;

  if (bubbleSystem) {
    for (let i = 0, l = bubbleSystem.invaders.length; i < l; i++) {
      bubbleSystem.invaders[i].enable();
    }
    // HACK, bone visibility typically takes a tick to update, but since we want to be able
    // to have enable() and disable() be reflected this frame, we need to do it immediately.
    boneVisibilitySystem.tick();
    boneVisibilitySystem.updateMatrices();
  }
}

function bindMaterial(world: HubsWorld, eid: EntityID) {
  const srcData = sourceDataMap.get(VideoTextureTarget.source[eid]);
  if (!srcData) {
    console.error("video-texture-target unable to find source");
    VideoTextureTarget.source[eid] = 0;
    return;
  }

  const mat = world.eid2mat.get(eid)! as MeshStandardMaterial;
  const targetData: TargetData = {
    originalMap: mat.map,
    originalEmissiveMap: mat.emissiveMap,
    originalBeforeRender: mat.onBeforeRender,
    boundTo: VideoTextureTarget.source[eid]
  };
  mat.onBeforeRender = function () {
    // Only update when a target were in view last frame
    // This is safe because this system always runs before render and invalid sources are unbound
    sourceDataMap.get(VideoTextureTarget.source[eid])!.needsUpdate = true;
  };
  if (VideoTextureTarget.flags[eid] & VIDEO_TEXTURE_TARGET_FLAGS.TARGET_BASE_MAP) {
    mat.map = srcData.renderTarget.texture;
  }
  if (VideoTextureTarget.flags[eid] & VIDEO_TEXTURE_TARGET_FLAGS.TARGET_EMISSIVE_MAP) {
    mat.emissiveMap = srcData.renderTarget.texture;
  }
  targetDataMap.set(eid, targetData);
}

function unbindMaterial(world: HubsWorld, eid: EntityID) {
  const targetData = targetDataMap.get(eid)!;
  const mat = world.eid2mat.get(eid)! as MeshStandardMaterial;
  if (VideoTextureTarget.flags[eid] & VIDEO_TEXTURE_TARGET_FLAGS.TARGET_BASE_MAP) {
    mat.map = targetData.originalMap;
  }
  if (VideoTextureTarget.flags[eid] & VIDEO_TEXTURE_TARGET_FLAGS.TARGET_EMISSIVE_MAP) {
    mat.emissiveMap = targetData.originalMap;
  }
  mat.onBeforeRender = targetData.originalBeforeRender;
  targetDataMap.delete(eid);
}

const sourceDataMap = new Map<EntityID, SourceData>();
const targetDataMap = new Map<EntityID, TargetData>();

const videoTextureSourceQuery = defineQuery([VideoTextureSource]);
const enteredVideoTextureSourcesQuery = enterQuery(videoTextureSourceQuery);
const exitedVideoTextureSourcesQuery = exitQuery(videoTextureSourceQuery);

const videoTextureTargetQuery = defineQuery([VideoTextureTarget, MaterialTag]);
const exitedVideoTextureTargetsQuery = exitQuery(videoTextureTargetQuery);
export function videoTextureSystem(world: HubsWorld) {
  enteredVideoTextureSourcesQuery(world).forEach(function (eid) {
    let camera = world.eid2obj.get(eid)! as PerspectiveCamera;
    if (!(camera && camera.isCamera)) {
      const actualCamera = findNode(camera, (o: any) => o.isCamera);
      if (actualCamera) {
        console.warn("video-texture-source should be added directly to a camera, not it's ancestor.");
        camera = actualCamera as PerspectiveCamera;
      } else {
        console.error("video-texture-source added to an entity without a camera");
        removeComponent(world, VideoTextureSource, eid);
        return;
      }
    }

    camera.layers.enable(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);
    camera.layers.enable(Layers.CAMERA_LAYER_FX_MASK);

    const resolution = VideoTextureSource.resolution[eid];
    camera.aspect = resolution[0] / resolution[1];

    // TODO currently if a video-texture-source tries to render itself it will fail with a warning.
    // If we want to support this we will need 2 render targets to swap back and forth.
    const renderTarget = new WebGLRenderTarget(resolution[0], resolution[1], {
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: NearestFilter,
      encoding: sRGBEncoding
    });

    // Since we are rendering directly to a texture we need to flip it vertically
    // See https://github.com/Hubs-Foundation/hubs/pull/4126#discussion_r610120237
    renderTarget.texture.matrixAutoUpdate = false;
    renderTarget.texture.matrix.scale(1, -1);
    renderTarget.texture.matrix.translate(0, 1);

    sourceDataMap.set(eid, { renderTarget, lastUpdated: 0, camera: camera.eid!, needsUpdate: false });
  });
  exitedVideoTextureSourcesQuery(world).forEach(function (eid) {
    const srcData = sourceDataMap.get(eid);
    if (srcData) {
      srcData.renderTarget.dispose();
      sourceDataMap.delete(eid);
    }
  });

  exitedVideoTextureTargetsQuery(world).forEach(function (eid) {
    const isBound = targetDataMap.has(eid);
    if (isBound && entityExists(world, eid)) unbindMaterial(world, eid);
    targetDataMap.delete(eid);
  });
  videoTextureTargetQuery(world).forEach(function (eid) {
    const source = VideoTextureTarget.source[eid];
    const isBound = targetDataMap.has(eid);
    if (isBound) {
      if (!source || !entityExists(world, source)) {
        unbindMaterial(world, eid);
        VideoTextureTarget.source[eid] = 0;
      } else if (source !== targetDataMap.get(eid)!.boundTo) {
        unbindMaterial(world, eid);
        bindMaterial(world, eid);
      }
    } else if (source && entityExists(world, source)) {
      bindMaterial(world, eid);
    }
  });

  videoTextureSourceQuery(world).forEach(function (eid) {
    const sourceData = sourceDataMap.get(eid)!;
    if (sourceData.needsUpdate && world.time.elapsed > sourceData.lastUpdated + 1000 / VideoTextureSource.fps[eid]) {
      updateRenderTarget(world, sourceData.renderTarget, sourceData.camera);
      sourceData.lastUpdated = world.time.elapsed;
      sourceData.needsUpdate = false;
    }
  });
}
