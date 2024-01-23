import { defineQuery, enterQuery, exitQuery, hasComponent, removeComponent } from "bitecs";
import { HubsWorld } from "../app";
import { InspectTargetChanged, Inspected } from "../bit-components";
import { CameraSystem } from "../systems/camera-system";
import { anyEntityWith } from "../utils/bit-utils";

const inspectedQuery = defineQuery([Inspected]);
const inspectedEnterQuery = enterQuery(inspectedQuery);
const inspectedExitQuery = exitQuery(inspectedQuery);
export function inspectSystem(world: HubsWorld, cameraSystem: CameraSystem) {
  inspectedExitQuery(world).forEach(eid => {
    cameraSystem.uninspect(hasComponent(world, InspectTargetChanged, eid));
    removeComponent(world, InspectTargetChanged, eid);
  });
  inspectedEnterQuery(world).forEach(eid => {
    const obj = world.eid2obj.get(eid);
    cameraSystem.inspect(obj, 1.5, hasComponent(world, InspectTargetChanged, eid));
  });
}
