import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { HubsWorld } from "../app";
import { Inspectable, Inspected } from "../bit-components";
import { CameraSystem } from "../systems/camera-system";

export const INSPECTABLE_FLAGS = {
  TARGET_CHANGED: 1 << 0
};

const inspectedQuery = defineQuery([Inspected]);
const inspectedEnterQuery = enterQuery(inspectedQuery);
const inspectedExitQuery = exitQuery(inspectedQuery);
export function inspectSystem(world: HubsWorld, cameraSystem: CameraSystem) {
  inspectedExitQuery(world).forEach(eid => {
    const targetChanged = Boolean(Inspectable.flags[eid] & INSPECTABLE_FLAGS.TARGET_CHANGED);
    cameraSystem.uninspect(targetChanged);
    Inspectable.flags[eid] = 0;
  });
  inspectedEnterQuery(world).forEach(eid => {
    const obj = world.eid2obj.get(eid);
    const targetChanged = Boolean(Inspectable.flags[eid] & INSPECTABLE_FLAGS.TARGET_CHANGED);
    cameraSystem.inspect(obj, 1.5, targetChanged);
  });
}
