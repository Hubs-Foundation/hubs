import { defineQuery, hasComponent } from "bitecs";
import { NetworkedTransform, Owned } from "../bit-components";

const query = defineQuery([NetworkedTransform]);

const tmpVec = new THREE.Vector3();
export function networkedTransformSystem(world) {
  const ents = query(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const obj = world.eid2obj.get(eid);
    if (hasComponent(world, Owned, eid)) {
      obj.position.toArray(NetworkedTransform.position[eid]);
    } else {
      tmpVec.fromArray(NetworkedTransform.position[eid]);
      if (!tmpVec.near(obj.position)) {
        console.log("Applying new position to ", eid);
        obj.position.copy(tmpVec);
        obj.matrixNeedsUpdate = true;
      }
    }
  }
}
