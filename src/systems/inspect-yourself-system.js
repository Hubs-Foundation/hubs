import { isLockedDownDemoRoom } from "../utils/hub-utils";
import { paths } from "./userinput/paths";
import { shouldUseNewLoader } from "../utils/bit-utils";
import { addComponent } from "bitecs";
import { Inspected, Inspectable } from "../bit-components";
import { INSPECTABLE_FLAGS } from "../bit-systems/inspect-system";
export class InspectYourselfSystem {
  tick(scene, userinput, cameraSystem) {
    if (!scene.is("entered")) return;
    if (userinput.get(paths.actions.startInspectingSelf) && !isLockedDownDemoRoom()) {
      const rig = document.getElementById("avatar-rig");
      if (shouldUseNewLoader()) {
        addComponent(APP.world, Inspected, rig.eid);
        Inspectable.flags[rig.eid] |= INSPECTABLE_FLAGS.TARGET_CHANGED;
      }
      cameraSystem.inspect(rig.object3D, 1.5);
    }
  }
}
