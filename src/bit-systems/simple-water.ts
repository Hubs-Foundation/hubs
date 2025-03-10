import { defineQuery, exitQuery } from "bitecs";
import { HubsWorld } from "../app";
import { SimpleWater } from "../bit-components";
import { SimpleWaterMesh } from "../objects/SimpleWaterMesh";

const simpleWaterQuery = defineQuery([SimpleWater]);

export function simpleWaterSystem(world: HubsWorld) {
  simpleWaterQuery(world).forEach(eid => {
    const simpleWater = world.eid2obj.get(eid) as SimpleWaterMesh;
    simpleWater.update(world.time.elapsed / 1000);
  });
}
