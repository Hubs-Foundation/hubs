import { defineQuery, exitQuery, hasComponent, removeEntity } from "bitecs";
import {
  AudioEmitter,
  EnvironmentSettings,
  GLTFModel,
  MediaImage,
  MediaFrame,
  MediaVideo,
  Object3DTag,
  Slice9,
  Text,
  VideoMenu
} from "../bit-components";
import { gltfCache } from "../components/gltf-model-plus";
import { releaseTextureByKey } from "../utils/load-texture";
import { disposeTexture } from "../utils/material-utils";
import { traverseSome } from "../utils/three-utils";

function cleanupObjOnExit(Component, f) {
  const query = exitQuery(defineQuery([Component]));
  return function (world) {
    query(world).forEach(eid => f(world.eid2obj.get(eid)));
  };
}

function cleanupOnExit(Component, f) {
  const query = exitQuery(defineQuery([Component]));
  return function (world) {
    query(world).forEach(eid => f(eid));
  };
}

// NOTE we don't dispose of slice9's textures here, its non trivial since they are shared.
// We want to keep them loaded anyway since we only have a few and want them to load instantly.
const cleanupSlice9s = cleanupObjOnExit(Slice9, obj => obj.geometry.dispose());
const cleanupGLTFs = cleanupObjOnExit(GLTFModel, obj => {
  if (obj.userData.gltfCacheKey) {
    gltfCache.release(obj.userData.gltfCacheKey);
  } else {
    obj.dispose();
  }
});
const cleanupTexts = cleanupObjOnExit(Text, obj => obj.dispose());
const cleanupMediaFrames = cleanupObjOnExit(MediaFrame, obj => obj.geometry.dispose());
const cleanupAudioEmitters = cleanupObjOnExit(AudioEmitter, obj => {
  obj.disconnect();
  const audioSystem = AFRAME.scenes[0].systems["hubs-systems"].audioSystem;
  audioSystem.removeAudio({ node: obj });
});
const cleanupImages = cleanupObjOnExit(MediaImage, obj => {
  releaseTextureByKey(APP.getString(MediaImage.cacheKey[obj.eid]));
  obj.geometry.dispose();
});
const cleanupVideos = cleanupObjOnExit(MediaVideo, obj => {
  disposeTexture(obj.material.map);
  obj.geometry.dispose();
});
const cleanupEnvironmentSettings = cleanupOnExit(EnvironmentSettings, eid => {
  EnvironmentSettings.map.delete(eid);
});

// TODO This feels messy and brittle
//
// This makes the assumption that we will not explicitly remove Object3DTag components.
// Instead, they will only be removed when we call removeEntity.
//
// When we remove an entity with an Object3DTag:
// - The associated object3D will be removed from the scene graph.
// - The rest of the scene graph will be left intact.
// - We will call removeEntity for all entities associated with the object3D's descendants.
// - The descendants won't be removed from their parents.
//
// TODO AFRAME entities get cleaned up in an an odd way:
//      When we remove an AFRAME entity, AFRAME will call `removeEntity` for all of its descendants,
//      which means we will remove each descendent from its parent.
const exitedObject3DQuery = exitQuery(defineQuery([Object3DTag]));
export function removeObject3DSystem(world) {
  function removeFromMap(eid) {
    const o = world.eid2obj.get(eid);
    world.eid2obj.delete(eid);
    o.eid = null;
  }

  // TODO  write removeObject3DEntity to do this work up-front,
  // keeping the scene graph consistent and avoiding the second exitedObject3DQuery in this system.
  // This becomes a "cleanup dangling resources" system that doesn't care
  // about the hierarchy

  // remove entities that are children of any removed entities
  const entities = exitedObject3DQuery(world);
  entities.forEach(eid => {
    const obj = world.eid2obj.get(eid);
    traverseSome(obj, o => {
      if (o.eid && hasComponent(world, VideoMenu, o.eid)) {
        return false;
      }
      o.eid && removeEntity(world, o.eid);
      return true;
    });
    obj.removeFromParent();
  });

  // cleanup any component specific resources
  cleanupGLTFs(world);
  cleanupSlice9s(world);
  cleanupTexts(world);
  cleanupMediaFrames(world);
  cleanupImages(world);
  cleanupVideos(world);
  cleanupEnvironmentSettings(world);
  cleanupAudioEmitters(world);

  // Finally remove all the entities we just removed from the eid2obj map
  entities.forEach(removeFromMap);
  exitedObject3DQuery(world).forEach(removeFromMap);
}
