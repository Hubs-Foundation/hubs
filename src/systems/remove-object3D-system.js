import { defineQuery, exitQuery, removeEntity } from "bitecs";
import { Object3DTag } from "../bit-components";

const exitedObject3DQuery = exitQuery(defineQuery([Object3DTag]));

// TODO this all feels quite messy and brittle
// This makes some assumptions:
// - We will not remove Object3DTags, instead we will remove thos entiteis entirely. This seems ok.
// - When you directly remove an entity associated with an object3D it will be removed from the scene graph
//  - It's children will have their entities removed but their scene graph will not be altered
//
// TODO aframe entiteis get cleaned up in a bit of an odd way
// since all of their entiteis are specifically removed, so they all get de-parented
export function removeObject3DSystem(world) {
  const entities = exitedObject3DQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const obj = world.eid2obj.get(eid);
    obj.traverse(function(o) {
      if (o.eid) {
        removeEntity(world, o.eid);
        world.eid2obj.delete(o.eid);
        o.eid = null;
      }
    });
    obj.removeFromParent();
  }

  // we have already processed all the newly removed entiteis, run query again to "consume" them
  exitedObject3DQuery(world);
}
}
