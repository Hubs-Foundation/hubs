import { Material } from "three";
import { HubsWorld } from "../../../app";
import { EntityID, Networked, NetworkedObjectMaterial, Owned } from "../../../bit-components";
import { Mesh } from "three";
import { hasComponent } from "bitecs";

export function setObjectMaterial(world: HubsWorld, eid: EntityID, matEid: EntityID) {
  const material = world.eid2mat.get(matEid);
  const obj = world.eid2obj.get(eid);

  if (!obj) {
    console.error(`set material: could not find entity`, eid);
    return;
  }
  if (!material) {
    console.error(`set material: could not find material`, matEid);
    return;
  }
  const mesh = obj as Mesh;
  if (!mesh.isMesh) {
    console.error(`set material: called on a non mesh`, eid);
    return;
  }
  mesh.material = material;

  if (hasComponent(world, NetworkedObjectMaterial, eid) && hasComponent(world, Owned, eid)) {
    const matEid = material.eid!;
    const matNid = Networked.id[matEid];
    NetworkedObjectMaterial.matNid[eid] = matNid;
  }
}

export function getObjectMaterial(world: HubsWorld, eid: EntityID): Material | null {
  const obj = world.eid2obj.get(eid);
  if (!obj) {
    return null;
  }
  const mesh = obj as Mesh;
  if (!mesh.isMesh) {
    return null;
  }
  return Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
}
