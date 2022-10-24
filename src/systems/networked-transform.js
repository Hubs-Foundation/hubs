import { defineQuery, hasComponent } from "bitecs";
import { NetworkedTransform, Owned } from "../bit-components";

const query = defineQuery([NetworkedTransform]);

const tmpVec = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
export function networkedTransformSystem(world) {
  const ents = query(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const obj = world.eid2obj.get(eid);
    if (hasComponent(world, Owned, eid)) {
      tmpVec.fromArray(NetworkedTransform.position[eid]);
      if (!tmpVec.near(obj.position, 0.001)) {
        obj.position.toArray(NetworkedTransform.position[eid]);
      }
      tmpQuat.fromArray(NetworkedTransform.rotation[eid]);
      // TODO does it even make sense to check "near" in this way?
      if (!tmpQuat.near(obj.quaternion, 0.001)) {
        obj.quaternion.toArray(NetworkedTransform.rotation[eid]);
      }
      tmpVec.fromArray(NetworkedTransform.scale[eid]);
      if (!tmpVec.near(obj.scale, 0.001)) {
        obj.scale.toArray(NetworkedTransform.scale[eid]);
      }
    } else {
      tmpVec.fromArray(NetworkedTransform.position[eid]);
      if (!tmpVec.near(obj.position)) {
        obj.position.copy(tmpVec);
        obj.matrixNeedsUpdate = true;
      }

      tmpQuat.fromArray(NetworkedTransform.rotation[eid]);
      if (!tmpQuat.near(obj.quaternion)) {
        obj.quaternion.copy(tmpQuat);
        obj.matrixNeedsUpdate = true;
      }

      tmpVec.fromArray(NetworkedTransform.scale[eid]);
      if (!tmpVec.near(obj.scale)) {
        obj.scale.copy(tmpVec);
        obj.matrixNeedsUpdate = true;
      }
    }
  }
}

// TODO lerping
