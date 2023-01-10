import { defineQuery, removeEntity } from "bitecs";
import { DestroyAtExtremeDistance } from "../bit-components";

const DIST = 1000;
const pos = new THREE.Vector3();

const query = defineQuery([DestroyAtExtremeDistance]);
export function destroyAtExtremeDistanceSystem(world) {
  const ents = query(world);
  if (!ents.length) return;

  // Check only one per frame
  const eid = ents[world.time.tick % ents.length];
  const obj = world.eid2obj.get(eid);
  obj.getWorldPosition(pos);
  if (pos.x < -DIST || pos.x > DIST || pos.y < -DIST || pos.y > DIST || pos.z < -DIST || pos.z > DIST) {
    removeEntity(world, eid);
  }
}
