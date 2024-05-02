import { addComponent, defineQuery, hasComponent, enterQuery } from "bitecs";
import { LinearRotate, LinearScale, LinearTranslate, NetworkedTransform, Owned, Networked } from "../bit-components";
import { millisecondsBetweenTicks } from "../bit-systems/networking";

const query = defineQuery([NetworkedTransform]);

const tmpVec = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();

const networkedTransformEnterQuery = enterQuery(query);
export function networkedTransformSystem(world) {
  networkedTransformEnterQuery(world).forEach(eid => {
    // If it's a scene object that has not been owned yet,
    // we initialize its networked transform to the initial object transform.
    if (Networked.creator[eid] === APP.getSid("scene") && Networked.owner[eid] === APP.getSid("reticulum")) {
      const obj = world.eid2obj.get(eid);
      NetworkedTransform.position[eid].set(obj.position.toArray());
      NetworkedTransform.rotation[eid].set(obj.quaternion.toArray());
      NetworkedTransform.scale[eid].set(obj.scale.toArray());
    }
  });
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
        addComponent(world, LinearTranslate, eid);
        LinearTranslate.duration[eid] = millisecondsBetweenTicks;
        LinearTranslate.targetX[eid] = tmpVec.x;
        LinearTranslate.targetY[eid] = tmpVec.y;
        LinearTranslate.targetZ[eid] = tmpVec.z;
      }

      tmpQuat.fromArray(NetworkedTransform.rotation[eid]);
      if (!tmpQuat.near(obj.quaternion)) {
        addComponent(world, LinearRotate, eid);
        LinearRotate.duration[eid] = millisecondsBetweenTicks;
        LinearRotate.targetX[eid] = tmpQuat.x;
        LinearRotate.targetY[eid] = tmpQuat.y;
        LinearRotate.targetZ[eid] = tmpQuat.z;
        LinearRotate.targetW[eid] = tmpQuat.w;
      }

      tmpVec.fromArray(NetworkedTransform.scale[eid]);
      if (!tmpVec.near(obj.scale)) {
        addComponent(world, LinearScale, eid);
        LinearScale.duration[eid] = millisecondsBetweenTicks;
        LinearScale.targetX[eid] = tmpVec.x;
        LinearScale.targetY[eid] = tmpVec.y;
        LinearScale.targetZ[eid] = tmpVec.z;
      }
    }
  }
}
