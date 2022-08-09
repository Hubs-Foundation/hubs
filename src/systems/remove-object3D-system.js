import { defineQuery, exitQuery, removeEntity } from "bitecs";
import { GLTFModel, MediaFrame, Object3DTag, Slice9, Text } from "../bit-components";
import { gltfCache } from "../components/gltf-model-plus";

function cleanupObjOnExit(Component, f) {
  const query = exitQuery(defineQuery([Component]));
  return function(world) {
    query(world).forEach(eid => f(world.eid2obj.get(eid)));
  };
}

// NOTE we don't dispose of slice9's textures here, its non trivial since they are shared.
// We want to keep them loaded anyway since we only have a few and want them to load instantly.
const cleanupSlice9s = cleanupObjOnExit(Slice9, obj => obj.geometry.dispose());
const cleanupGLTFs = cleanupObjOnExit(GLTFModel, obj => gltfCache.release(obj.userData.gltfSrc));
const cleanupTexts = cleanupObjOnExit(Text, obj => obj.dispose());
const cleanupMediaFrames = cleanupObjOnExit(MediaFrame, obj => obj.geometry.dispose());

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

  // remove entities that are children of any removed entities
  const entities = exitedObject3DQuery(world);
  entities.forEach(eid => {
    const obj = world.eid2obj.get(eid);
    obj.traverse(o => o.eid && removeEntity(world, o.eid));
    obj.removeFromParent();
  });

  // cleanup any component specific resources
  cleanupGLTFs(world);
  cleanupSlice9s(world);
  cleanupTexts(world);
  cleanupMediaFrames(world);

  // Finally remove all the entities we just removed from the eid2obj map
  entities.forEach(removeFromMap);
  exitedObject3DQuery(world).forEach(removeFromMap);
}
