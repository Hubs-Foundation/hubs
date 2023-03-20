import { Euler } from "three";
import { HubsWorld } from "../app";
import { Fit, inflatePhysicsShape, Shape } from "./physics-shape";

export type BoxColliderParams = {
  position: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
};

const DEFAULTS = {
  position: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  rotation: { x: 0, y: 0, z: 0 }
};

export function inflateBoxCollider(world: HubsWorld, eid: number, params: BoxColliderParams) {
  params = Object.assign({}, DEFAULTS, params);

  const euler = new Euler();
  euler.set(params.rotation.x, params.rotation.y, params.rotation.z);
  const orientation = new THREE.Quaternion().setFromEuler(euler);

  inflatePhysicsShape(world, eid, {
    type: Shape.BOX,
    fit: Fit.MANUAL,
    offset: [params.position.x, params.position.y, params.position.z],
    halfExtents: [params.scale.x / 2, params.scale.y / 2, params.scale.z / 2],
    orientation: [orientation.x, orientation.y, orientation.z, orientation.w]
  });
}
