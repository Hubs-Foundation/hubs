import { hasComponent } from "bitecs";
import { HubsWorld } from "../../../app";
import { GLTFMaterial } from "../entity-nodes";
import { EntityID, NetworkedMaterial, Owned } from "../../../bit-components";
import { Color, Euler, MeshStandardMaterial, Vector3 } from "three";
import { material2NetworkedMaterial } from "../systems/material-system";

export const NEEDS_UPDATE_PROPERTIES: (keyof GLTFMaterial)[] = [
  "flatShading",
  "map",
  "lightMap",
  "aoMap",
  "emissiveMap",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "alphaMap"
];

export function setMaterial(world: HubsWorld, eid: EntityID, props: Partial<GLTFMaterial>) {
  let material = world.eid2mat.get(eid)! as any;
  for (const [key, value] of Object.entries(props)) {
    if (value instanceof Euler || value instanceof Color || value instanceof Vector3) {
      const prop = material[key];
      prop.copy(value);
    } else {
      material[key] = value;
    }
    if (NEEDS_UPDATE_PROPERTIES.includes(key as keyof GLTFMaterial)) material.needsUpdate = true;
  }
  if (hasComponent(world, NetworkedMaterial, eid) && hasComponent(world, Owned, eid)) {
    material2NetworkedMaterial(eid, material);
  }
}

export function getMaterial(world: HubsWorld, eid: EntityID): Partial<GLTFMaterial> {
  let material = world.eid2mat.get(eid)! as MeshStandardMaterial;
  return material;
}
