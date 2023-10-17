import { defineQuery, enterQuery, hasComponent } from "bitecs";
import { Material, Mesh } from "three";
import { EntityID, Networked, NetworkedObjectMaterial, Owned } from "../../../bit-components";
import { HubsWorld } from "../../../app";
import { forEachMaterial } from "../../../utils/material-utils";

function getObjectMaterial(world: HubsWorld, eid: EntityID): Material | null {
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

// TODO Support multiple materials por object
const networkedObjectMaterialQuery = defineQuery([Networked, NetworkedObjectMaterial]);
const networkedObjectMaterialEnterQuery = enterQuery(networkedObjectMaterialQuery);
const networkedObjectMaterialExitQuery = enterQuery(networkedObjectMaterialQuery);
export function objectMaterialSystem(world: HubsWorld) {
  const query = networkedObjectMaterialEnterQuery(world);
  for (let i = 0; i < query.length; i++) {
    const eid = query[i];
    const obj = world.eid2obj.get(eid)!;
    forEachMaterial(obj, (mat: Material) => {
      const matEid = mat.eid!;
      const matNid = Networked.id[matEid];
      NetworkedObjectMaterial.matNid[eid] = matNid;
    });
  }
  networkedObjectMaterialExitQuery(world).forEach(eid => {
    NetworkedObjectMaterial.matNid[eid] = 0;
  });
  networkedObjectMaterialQuery(world).forEach(eid => {
    const material = getObjectMaterial(world, eid);
    if (material) {
      const matEid = material.eid!;
      const matNid = Networked.id[matEid];
      if (!hasComponent(world, Owned, eid)) {
        if (NetworkedObjectMaterial.matNid[eid] !== matNid) {
          const newMatNid = NetworkedObjectMaterial.matNid[eid];
          const obj = APP.world.eid2obj.get(eid)!;
          if (!obj) {
            return;
          }
          const mesh = obj as Mesh;
          if (!mesh.isMesh) {
            return;
          }
          const newMatEid = world.nid2eid.get(newMatNid)!;
          const newMaterial = world.eid2mat.get(newMatEid)!;
          if (newMaterial) {
            mesh.material = newMaterial;
          }
        }
      }
    }
  });
}
