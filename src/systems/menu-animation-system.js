import { waitForDOMContentLoaded } from "../utils/async-utils";
import { elasticOut } from "../utils/easing";
const MENU_ANIMATION_DURATION_MS = 750;
export class MenuAnimationSystem {
  constructor() {
    this.components = [];
    this.data = new Map();
    this.tick = this.tick.bind(this);
    waitForDOMContentLoaded().then(() => {
      this.viewingCameraEl = document.getElementById("viewing-camera");
    });
  }
  register(component, menuEl, chooseScale) {
    this.components.push(component);
    this.data.set(component, {
      menuEl,
      chooseScale,
      menuOpenTime: -1,
      startScaleAtMenuOpenTime: 0,
      wasMenuVisible: false,
      endingScale: 0
    });
  }
  unregister(component) {
    this.components.splice(this.components.indexOf(component), 1);
    this.data.delete(component);
  }
  tick = (function() {
    const menuToCamera = new THREE.Vector3();
    const menuScale = new THREE.Vector3();
    const menuParentScale = new THREE.Vector3();
    const menuPosition = new THREE.Vector3();
    const cameraPosition = new THREE.Vector3();
    return function tick(t) {
      if (!this.viewingCameraEl) {
        return;
      }
      const camera = this.viewingCameraEl.object3DMap.camera;
      camera.updateMatrices();
      cameraPosition.setFromMatrixPosition(camera.matrixWorld);

      for (let i = 0; i < this.components.length; i++) {
        const datum = this.data.get(this.components[i]);
        const isMenuVisible = datum.menuEl.object3D.visible;
        const isMenuOpening = isMenuVisible && !datum.wasMenuVisible;
        const distanceToMenu = menuToCamera
          .subVectors(cameraPosition, menuPosition.setFromMatrixPosition(datum.menuEl.object3D.matrixWorld))
          .length();
        datum.menuEl.object3D.parent.updateMatrices();
        menuParentScale.setFromMatrixScale(datum.menuEl.object3D.parent.matrixWorld);
        if (isMenuOpening) {
          const scale = datum.chooseScale
            ? THREE.Math.clamp(0.45 * distanceToMenu, 0.05, 4)
            : menuScale.setFromMatrixScale(datum.menuEl.object3D.matrixWorld).x;
          datum.endingScale = scale / menuParentScale.x;
          datum.menuOpenTime = t;
          datum.startScaleAtMenuOpenTime = datum.endingScale * 0.8;
        }
        if (isMenuVisible) {
          const currentScale = THREE.Math.lerp(
            datum.startScaleAtMenuOpenTime,
            datum.endingScale,
            elasticOut(THREE.Math.clamp((t - datum.menuOpenTime) / MENU_ANIMATION_DURATION_MS, 0, 1))
          );
          if (datum.menuEl.object3D.scale.x !== currentScale) {
            datum.menuEl.object3D.scale.setScalar(currentScale);
            datum.menuEl.object3D.matrixNeedsUpdate = true;
          }
        }
        datum.wasMenuVisible = isMenuVisible;
      }
    };
  })();
}
