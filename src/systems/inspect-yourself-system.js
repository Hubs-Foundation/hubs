import { paths } from "./userinput/paths";
import { setMatrixWorld } from "../utils/three-utils";
const rotate = new THREE.Matrix4().makeRotationY(Math.PI);
const m = new THREE.Matrix4();
export class InspectYourselfSystem {
  tick(scene, userinput, cameraSystem) {
    if (!scene.is("entered")) return;
    if (userinput.get(paths.actions.startInspectingSelf)) {
      const rig = document.getElementById("avatar-rig");
      const you = document.getElementById("inspect-yourself");
      const pov = document.getElementById("avatar-pov-node");
      setMatrixWorld(you.object3D, m.copy(pov.object3D.matrixWorld).multiply(rotate));
      cameraSystem.inspect(you.object3D, 1, false, rig.object3D);
    }
  }
}
