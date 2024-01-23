import { defineQuery } from "bitecs";
import { HubsWorld } from "../app";
import { AvatarPOVNode, FollowInFov } from "../bit-components";
import { Euler, MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { anyEntityWith } from "../utils/bit-utils";

const targetPos = new Vector3();
const offset = new Vector3();
const snappedRot = new Euler();
const snappedQ = new Quaternion();
const snappedXForm = new Matrix4();
const snappedXFormWorld = new Matrix4();
const tempVector = new Vector3();

const followInFovQuery = defineQuery([FollowInFov]);
export function followInFovSystem(world: HubsWorld) {
  followInFovQuery(world).forEach(eid => {
    const obj = world.eid2obj.get(eid)!;
    if (!obj.visible) return;

    const targetEid = anyEntityWith(world, AvatarPOVNode)!;
    const targetObj = world.eid2obj.get(targetEid)!;
    if (!targetObj) return;

    offset.fromArray(FollowInFov.offset[eid]);

    // Compute position + rotation by projecting offset along a downward ray in target space,
    // and mask out Z rotation.
    snappedRot.set(-FollowInFov.angle[eid] * MathUtils.DEG2RAD, targetObj.rotation.y, 0, targetObj.rotation.order);
    snappedQ.setFromEuler(snappedRot);
    snappedXForm.compose(targetObj.position, snappedQ, targetObj.scale);
    snappedXFormWorld.multiplyMatrices(targetObj.parent!.matrixWorld, snappedXForm);

    targetPos.copy(offset);
    targetPos.applyMatrix4(snappedXFormWorld);

    if (obj.parent) {
      obj.parent.worldToLocal(targetPos);
    }

    if (!FollowInFov.started[eid]) {
      obj.position.copy(targetPos);
      FollowInFov.started[eid] = 1;
    } else {
      const speed = FollowInFov.speed[eid];
      const t = speed * world.time.delta;

      obj.position.set(
        obj.position.x + (targetPos.x - obj.position.x) * t,
        obj.position.y + (targetPos.y - obj.position.y) * t,
        obj.position.z + (targetPos.z - obj.position.z) * t
      );
    }

    snappedXFormWorld.decompose(tempVector, obj.quaternion, tempVector);
    obj.matrixNeedsUpdate = true;
  });
}
