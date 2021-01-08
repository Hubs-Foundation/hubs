import { paths } from "./userinput/paths";
export class InspectYourselfSystem {
  tick(scene, userinput, cameraSystem) {
    if (!scene.is("entered")) return;
    if (userinput.get(paths.actions.startInspectingSelf)) {
      const rig = document.getElementById("avatar-rig");
      cameraSystem.inspect(rig, 1.5);
    }
  }
}
