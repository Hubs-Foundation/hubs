/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";

export function Cube() {
  return <entity name="Cube" object3D={new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshBasicMaterial())} />;
}
