import { squareDistanceBetween } from "../utils/three-utils";
const MIN_DISTANCE = 0.2;
export class ScaleInScreenSpaceSystem {
  constructor() {
    this.components = [];
  }
  register(c) {
    this.components.push(c);
  }
  unregister(c) {
    this.components = this.components.filter(comp => comp !== c);
  }

  tick = (function() {
    const parentScale = new THREE.Vector3();
    return function tick() {
      this.viewingCamera = this.viewingCamera || document.getElementById("viewing-camera");
      for (let i = 0; i < this.components.length; i++) {
        const component = this.components[i];
        // TODO: This calculates the distance to the viewing camera, the correct distance might be to the viewing plane.
        // This seemed accurate enough in my testing.
        const distance = Math.sqrt(squareDistanceBetween(component.el.object3D, this.viewingCamera.object3DMap.camera));
        if (distance < MIN_DISTANCE) {
          component.el.object3D.scale.set(0.00001, 0.000001, 0.00001);
        } else {
          const parent = component.el.object3D.parent;
          parent.updateMatrices();
          parentScale.setFromMatrixScale(parent.matrixWorld);
          component.el.object3D.scale.set(
            (1 / parentScale.x) * (component.data.baseScale.x + distance * component.data.addedScale.x),
            (1 / parentScale.y) * (component.data.baseScale.y + distance * component.data.addedScale.y),
            (1 / parentScale.z) * (component.data.baseScale.z + distance * component.data.addedScale.z)
          );
        }
        component.el.object3D.matrixNeedsUpdate = true;
      }
    };
  })();
}
