import { defineQuery, exitQuery, removeEntity } from "bitecs";
import { Object3DTag } from "../bit-components";

const exitedObject3DQuery = exitQuery(defineQuery([Object3DTag]));

// TODO This feels messy and brittle
//
// This makes the assumption that we will not explicitly remove Object3DTag components.
// Instead, they will only be removed when we call removeEntity.
//
// When we remove an entity with an Object3DTag:
// - The associated object3D will be removed from the scene graph.
// - The rest of the scene graph will be left intact.
// - We will call removeEntity for all entities associated with the object3D's descendents.
//
// TODO AFRAME entities get cleaned up in an an odd way:
//      When we remove an AFRAME entity, AFRAME will call `removeEntity` for all of its descendents,
//      which means we will remove each descendent from its parent.
export function removeObject3DSystem(world) {
  const entities = exitedObject3DQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const obj = world.eid2obj.get(eid);
    if (!obj) {
      // console.log(`No obj found for ${eid}`);
      continue;
    } else {
      // console.log(`Removing obj for ${eid}`);
    }
    obj.traverse(function(o) {
      if (o.eid) {
        removeEntity(world, o.eid);
        world.eid2obj.delete(o.eid);
        o.eid = null;
      }
    });
    obj.removeFromParent();
  }

  // We already processed all the newly removed entities. Run query again to "consume" them.
  exitedObject3DQuery(world);
}
