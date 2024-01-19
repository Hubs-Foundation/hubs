import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { HubsWorld } from "../app";
import { Inspectable, Inspected } from "../bit-components";
import { CameraSystem } from "../systems/camera-system";

const inspectedQuery = defineQuery([Inspected]);
const inspectedEnterQuery = enterQuery(inspectedQuery);
const inspectedExitQuery = exitQuery(inspectedQuery);
export function inspectSystem(world: HubsWorld, cameraSystem: CameraSystem) {
  inspectedEnterQuery(world).forEach(eid => {
    const obj = world.eid2obj.get(eid);
    cameraSystem.inspect(obj, 1.5, Boolean(Inspectable.fireChangeEvent[eid]));
  });
  inspectedExitQuery(world).forEach(eid => {
    const obj = world.eid2obj.get(eid);
    cameraSystem.uninspect(Boolean(Inspectable.fireChangeEvent[eid]));
  });
}
