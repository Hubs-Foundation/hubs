import { CAMERA_MODE_INSPECT } from "./camera-system.js";
import { setMatrixWorld } from "../utils/three-utils";

let viewingCamera;
let uiRoot;
export class ScenePreviewCameraSystem {
  constructor() {
    this.entities = [];
  }

  register(el) {
    this.entities.push(el);
  }

  unregister(el) {
    this.entities.splice(this.entities.indexOf(el, 1));
  }

  tick() {
    viewingCamera = viewingCamera || document.getElementById("viewing-camera");
    uiRoot = uiRoot || document.getElementById("ui-root");
    const isGhost =
      uiRoot &&
      uiRoot.firstChild &&
      (uiRoot.firstChild.classList.contains("watching") || uiRoot.firstChild.classList.contains("hide"));
    const entered = viewingCamera && viewingCamera.sceneEl.is("entered");
    for (const el of this.entities) {
      const hubsSystems = AFRAME.scenes[0].systems["hubs-systems"];
      if (el && (!hubsSystems || (hubsSystems.cameraSystem.mode !== CAMERA_MODE_INSPECT && !isGhost && !entered))) {
        el.components["scene-preview-camera"].tick2();
        if (hubsSystems && viewingCamera) {
          el.object3D.updateMatrices();
          setMatrixWorld(viewingCamera.object3D, el.object3D.matrixWorld);
        }
      }
    }
  }
}
