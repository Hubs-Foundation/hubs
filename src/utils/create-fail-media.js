import { addEntity } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";

export function createFailMedia(world) {
  const eid = addEntity(world);
  addObject3DComponent(world, eid, new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));
  return eid;
}
