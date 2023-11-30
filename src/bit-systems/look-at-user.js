import { defineQuery, hasComponent } from "bitecs";
import { LookAtUser, Object3DTag } from "../bit-components";

export function lookAtUserSystem(world) {
  const lookQuery = defineQuery([LookAtUser]);

  lookQuery(world).forEach(eid => {
    var avatarPovObj;
    try {
      avatarPovObj = document.querySelector("#avatar-pov-node").object3D;
    } catch {
      return;
    }

    if (hasComponent(world, Object3DTag, eid)) {
      const obj = world.eid2obj.get(eid);
      obj.lookAt(avatarPovObj.getWorldPosition(new THREE.Vector3()));
    } else console.log(eid, "doesn't have 3d object");
  });
}
