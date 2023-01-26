import { defineQuery, enterQuery, exitQuery } from "bitecs";
import {
  Camera,
  LinearFilter,
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

interface SourceData {
  renderTarget: WebGLRenderTarget;
  lastUpdated: number;
  camera: EntityID;
}

interface TargetData {
  originalMap: Texture | null;
  originalEmissiveMap: Texture | null;
}

const sourceDataMap = new Map<EntityID, SourceData>();
const targetDataMap = new Map<EntityID, TargetData>();

const videoTextureSourceQuery = defineQuery([VideoTextureSource]);
const enteredVideoTextureSourcesQuery = enterQuery(videoTextureSourceQuery);
const exitedVideoTextureSourcesQuery = exitQuery(videoTextureSourceQuery);

const videoTextureTargetQuery = defineQuery([VideoTextureTarget, MaterialTag]);
const enteredVideoTextureTargetsQuery = enterQuery(videoTextureTargetQuery);
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
        return;
      }
    }

    camera.layers.enable(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);

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
    // See https://github.com/mozilla/hubs/pull/4126#discussion_r610120237
    renderTarget.texture.matrixAutoUpdate = false;
    renderTarget.texture.matrix.scale(1, -1);
    renderTarget.texture.matrix.translate(0, 1);

    sourceDataMap.set(eid, { renderTarget, lastUpdated: 0, camera: camera.eid! });
  });
  exitedVideoTextureSourcesQuery(world).forEach(function (eid) {
    const srcData = sourceDataMap.get(eid);
    if (srcData) {
      srcData.renderTarget.dispose();
      sourceDataMap.delete(eid);
    }
  });

  enteredVideoTextureTargetsQuery(world).forEach(function (eid) {
    const srcData = sourceDataMap.get(VideoTextureTarget.source[eid]);
    const targetData: TargetData = { originalMap: null, originalEmissiveMap: null };
    targetDataMap.set(eid, targetData);

    if (!srcData) {
      console.error("video-texture-target unable to find source");
      return;
    }

    const mat = world.eid2mat.get(eid)! as MeshStandardMaterial;
    if (VideoTextureTarget.flags[eid] & VIDEO_TEXTURE_TARGET_FLAGS.TARGET_BASE_MAP) {
      targetData.originalMap = mat.map;
      mat.map = srcData.renderTarget.texture;
    }
    if (VideoTextureTarget.flags[eid] & VIDEO_TEXTURE_TARGET_FLAGS.TARGET_EMISSIVE_MAP) {
      targetData.originalEmissiveMap = mat.emissiveMap;
      mat.emissiveMap = srcData.renderTarget.texture;
    }
  });
  exitedVideoTextureTargetsQuery(world).forEach(function (eid) {
    const targetData = targetDataMap.get(VideoTextureTarget.source[eid])!;
    const mat = world.eid2mat.get(eid)! as MeshStandardMaterial;
    if (VideoTextureTarget.flags[eid] & VIDEO_TEXTURE_TARGET_FLAGS.TARGET_BASE_MAP) {
      mat.map = targetData.originalMap;
    }
    if (VideoTextureTarget.flags[eid] & VIDEO_TEXTURE_TARGET_FLAGS.TARGET_EMISSIVE_MAP) {
      mat.emissiveMap = targetData.originalMap;
    }
    targetDataMap.delete(eid);
  });

  videoTextureSourceQuery(world).forEach(function (eid) {
    const data = sourceDataMap.get(eid);
    if (data && world.time.elapsed > data.lastUpdated + 1000 / VideoTextureSource.fps[eid]) {
      updateRenderTarget(world, data.renderTarget, data.camera);
      data.lastUpdated = world.time.elapsed;
    }
  });
}
