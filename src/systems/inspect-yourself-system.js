import { paths } from "./userinput/paths";
import { getInspectableAndPivot } from "../systems/camera-system";
export class InspectYourselfSystem {
  tick(scene, userinput, cameraSystem) {
    if (!scene.is("entered")) return;
    if (userinput.get(paths.actions.startInspectingSelf)) {
      const rig = document.getElementById("avatar-rig");
      const { inspectable, pivot } = getInspectableAndPivot(rig);
      cameraSystem.inspect(inspectable, pivot, 0.75, false);
    }
  }
}
