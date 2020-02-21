import { waitForDOMContentLoaded } from "../utils/async-utils";
import { elasticOut } from "../utils/easing";
const MENU_ANIMATION_DURATION_MS = 750;
export class MenuAnimationSystem {
  constructor() {
    this.els = [];
    this.data = new Map();
    this.tick = this.tick.bind(this);
    waitForDOMContentLoaded().then(() => {
      this.viewingCamera = document.getElementById("viewing-camera").object3D;
    });
  }
  register(rootEl, menuEl) {
    this.els.push(rootEl);
    this.data.set(rootEl, { menuEl, menuOpenTime: -1, startScaleAtMenuOpenTime: 0, wasMenuVisible: false, endingScale: 0 });
  }
  unregister(el) {
    this.els.splice(this.els.indexOf(el), 1);
    this.data.delete(el);
  }
  tick = (function() {
    const menuToCamera = new THREE.Vector3();
    const menuParentScale = new THREE.Vector3();
    const menuPosition = new THREE.Vector3();
    const cameraPosition = new THREE.Vector3();
    return function tick(t) {
      if (!this.viewingCamera) {
        return;
      }
      this.viewingCamera.updateMatrices();
      cameraPosition.setFromMatrixPosition(this.viewingCamera.matrixWorld);

      for (let i = 0; i < this.els.length; i++) {
        const el = this.els[i];
        if (!el.components["gltf-model-plus"]) {
          continue; // TODO: Should not have even been registered, in this case
        }
        const datum = this.data.get(el);
        const isMenuVisible = datum.menuEl.object3D.visible;
        const isMenuOpening = isMenuVisible && !datum.wasMenuVisible;
        const distanceToMenu = menuToCamera
          .subVectors(cameraPosition, menuPosition.setFromMatrixPosition(datum.menuEl.object3D.matrixWorld))
          .length();
        datum.menuEl.object3D.parent.updateMatrices();
        menuParentScale.setFromMatrixScale(datum.menuEl.object3D.parent.matrixWorld);
        if (isMenuOpening) {
          datum.endingScale = (0.45 * distanceToMenu) / menuParentScale.x;
          datum.menuOpenTime = t;
          datum.startScaleAtMenuOpenTime = datum.endingScale * 0.8;
        }
        if (isMenuVisible) {
          const currentScale = THREE.Math.lerp(
            datum.startScaleAtMenuOpenTime,
            datum.endingScale,
            elasticOut(THREE.Math.clamp((t - datum.menuOpenTime) / MENU_ANIMATION_DURATION_MS, 0, 1))
          );
          datum.menuEl.object3D.scale.setScalar(currentScale);
          datum.menuEl.object3D.matrixNeedsUpdate = true;
          // TODO: If scaling becomes a hotspot on mobile because all object menus open in freeze mode, we can round robin the scale updates.
        }
        datum.wasMenuVisible = isMenuVisible;
      }
    };
  })();
}
