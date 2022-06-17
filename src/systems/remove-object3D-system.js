import { defineQuery, exitQuery, removeEntity } from "bitecs";
import { GLTFModel, Object3DTag, Slice9, Text } from "../bit-components";
import { gltfCache } from "../components/gltf-model-plus";

const exitedGTLFQuery = exitQuery(defineQuery([GLTFModel]));
function cleanupGLTFs(world) {
  exitedGTLFQuery(world).forEach(eid => gltfCache.release(world.eid2obj.get(eid).userData.gltfSrc));
}

const exitedSlice9Query = exitQuery(defineQuery([Slice9]));
function cleanupSlice9s(world) {
  // TODO slice9's currently all share textures so we can't easily dispose of them here
  // with three 136's Source API we can just have them each have their own Texture instace
  // and the new Source concept will deal with deduping and disposing of no longer referenced things.
  // That said, we likely will never actually dispose of the slice9 textures anyway since they are used in UI.
  exitedSlice9Query(world).forEach(eid => world.eid2obj.get(eid).geometry.dispose());
}

const exitedTextQuery = exitQuery(defineQuery([Text]));
function cleanupTexts(world) {
  exitedTextQuery(world).forEach(eid => world.eid2obj.get(eid).dispose());
}

// TODO This feels messy and brittle
//
// This makes the assumption that we will not explicitly remove Object3DTag components.
// Instead, they will only be removed when we call removeEntity.
//
// When we remove an entity with an Object3DTag:
// - The associated object3D will be removed from the scene graph.
// - The rest of the scene graph will be left intact.
// - We will call removeEntity for all entities associated with the object3D's descendents.
// - The descendents won't be removed from their parents.
//
// TODO AFRAME entities get cleaned up in an an odd way:
//      When we remove an AFRAME entity, AFRAME will call `removeEntity` for all of its descendents,
//      which means we will remove each descendent from its parent.
const exitedObject3DQuery = exitQuery(defineQuery([Object3DTag]));
export function removeObject3DSystem(world) {
  function removeFromMap(eid) {
    const o = world.eid2obj.get(eid);
    world.eid2obj.delete(eid);
    o.eid = null;
  }

  // remove entities that are children of any removed entiteis
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

  // Finally remove all the entiteis we just removed from the eid2obj map
  entities.forEach(removeFromMap);
  exitedObject3DQuery(world).forEach(removeFromMap);
}
