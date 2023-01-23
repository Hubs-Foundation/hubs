import { defineQuery, exitQuery } from "bitecs";
import { HubsWorld } from "../app";
import { SimpleWater } from "../bit-components";
import { SimpleWaterMesh } from "../inflators/simple-water";
import { disposeMaterial } from "../utils/three-utils";

const simpleWaterQuery = defineQuery([SimpleWater]);
const exitSimpleWaterQuery = exitQuery(simpleWaterQuery);

export function simpleWaterSystem(world: HubsWorld) {
  exitSimpleWaterQuery(world).forEach(eid => {
    const obj = world.eid2obj.get(eid) as SimpleWaterMesh;
    if (obj) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach(material => disposeMaterial(material));
      } else {
        disposeMaterial(obj.material);
      }
    }
  });

  simpleWaterQuery(world).forEach(eid => {
    const simpleWater = world.eid2obj.get(eid) as SimpleWaterMesh;
    simpleWater.update(world.time.elapsed / 1000);
  });
}
