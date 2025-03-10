import { defineQuery, removeComponent } from "bitecs";
import { Quaternion, Vector3 } from "three";
import { LinearRotate, LinearScale, LinearTranslate, Object3DTag } from "../bit-components";
import { HubsWorld } from "../app";

// Working variables
const _vec3 = new Vector3();
const _quat = new Quaternion();

const linearTranslateQuery = defineQuery([LinearTranslate, Object3DTag]);
const linearRotateQuery = defineQuery([LinearRotate, Object3DTag]);
const linearScaleQuery = defineQuery([LinearScale, Object3DTag]);

export function linearTransformSystem(world: HubsWorld) {
  linearTranslateQuery(world).forEach(eid => {
    const duration = LinearTranslate.duration[eid];
    const targetX = LinearTranslate.targetX[eid];
    const targetY = LinearTranslate.targetY[eid];
    const targetZ = LinearTranslate.targetZ[eid];

    const deltaTime = world.time.delta;
    const obj = world.eid2obj.get(eid)!;

    if (deltaTime >= duration) {
      obj.position.set(targetX, targetY, targetZ);
      removeComponent(world, LinearTranslate, eid);
    } else {
      obj.position.lerp(_vec3.set(targetX, targetY, targetZ), deltaTime / duration);
      LinearTranslate.duration[eid] = duration - deltaTime;
    }
    obj.matrixNeedsUpdate = true;
  });

  linearRotateQuery(world).forEach(eid => {
    const duration = LinearRotate.duration[eid];
    const targetX = LinearRotate.targetX[eid];
    const targetY = LinearRotate.targetY[eid];
    const targetZ = LinearRotate.targetZ[eid];
    const targetW = LinearRotate.targetW[eid];

    const deltaTime = world.time.delta;
    const obj = world.eid2obj.get(eid)!;

    if (deltaTime >= duration) {
      obj.quaternion.set(targetX, targetY, targetZ, targetW);
      removeComponent(world, LinearRotate, eid);
    } else {
      obj.quaternion.slerp(_quat.set(targetX, targetY, targetZ, targetW), deltaTime / duration);
      LinearRotate.duration[eid] = duration - deltaTime;
    }
    obj.matrixNeedsUpdate = true;
  });

  linearScaleQuery(world).forEach(eid => {
    const duration = LinearScale.duration[eid];
    const targetX = LinearScale.targetX[eid];
    const targetY = LinearScale.targetY[eid];
    const targetZ = LinearScale.targetZ[eid];

    const deltaTime = world.time.delta;
    const obj = world.eid2obj.get(eid)!;

    if (deltaTime >= duration) {
      obj.scale.set(targetX, targetY, targetZ);
      removeComponent(world, LinearScale, eid);
    } else {
      obj.scale.lerp(_vec3.set(targetX, targetY, targetZ), deltaTime / duration);
      LinearScale.duration[eid] = duration - deltaTime;
    }
    obj.matrixNeedsUpdate = true;
  });
}
