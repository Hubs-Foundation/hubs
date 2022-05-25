import { exitQuery, defineQuery } from "bitecs";
import { Object3DTag } from "../bit-components";

const exitedObject3DQuery = exitQuery(defineQuery([Object3DTag]));

export function removeObject3DSystem(world) {
  const entities = exitedObject3DQuery(world);
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const obj = world.eid2obj.get(eid);
    world.eid2obj.delete(eid);
    obj.eid = null;
    obj.removeFromParent();
  }
}
