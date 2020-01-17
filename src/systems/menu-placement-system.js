import { almostEqualVector3, almostEqualQuaternion } from "../utils/three-utils";
import { computeObjectAABB } from "../utils/auto-box-collider";
AFRAME.registerComponent("menu-placement-root", {
  schema: {
    menuSelector: { type: "string" }
  },
  init() {
    this.system = this.el.sceneEl.systems["hubs-systems"].menuPlacementSystem;
    this.didRegisterWithSystem = false;
  },
  play() {
    if (!this.didRegisterWithSystem) {
      this.system.register(this);
      this.didRegisterWithSystem = true;
    }
  },
  remove() {
    if (this.didRegisterWithSystem) {
      this.system.unregister(this);
    }
  }
});
function matchRootEl(rootEl) {
  return function match(tuple) {
    return tuple.rootEl === rootEl;
  };
}

// TODO: Set scale based on size in viewport
function restartMenuAnimation(menuEl, menuIsAnimating) {
  const toScale = 1;
  if (menuIsAnimating) {
    menuEl.removeAttribute("animation__show");
  }
  const fromScale = toScale * 0.8;
  menuEl.setAttribute("animation__show", {
    property: "scale",
    dur: 300,
    from: { x: fromScale, y: fromScale, z: fromScale },
    to: { x: toScale, y: toScale, z: toScale },
    easing: "easeOutElastic"
  });
  menuEl.object3D.matrixNeedsUpdate = true;
}
export class MenuPlacementSystem {
  constructor() {
    this.data = [];
    this.tick = this.tick.bind(this);
    this.register = this.register.bind(this);
  }
  register = (function() {
    const currentRootObjectRotation = new THREE.Matrix4();
    return function register(menuPlacementRoot) {
      const rootEl = menuPlacementRoot.el;
      const menuEl = rootEl.querySelector(menuPlacementRoot.data.menuSelector);
      if (!menuEl) {
        console.error(
          `Could not find menu for placement. The selector was ${
            menuPlacementRoot.data.menuSelector
          }. The root element was:`,
          rootEl
        );
        return;
      }
      this.data.push({
        rootEl,
        previousRootMesh: rootEl.getObject3D("mesh"),
        didComputeAabbAtLeastOnce: false,
        rootMeshAABB: new THREE.Box3(),
        rootMeshCenter: new THREE.Vector3(),
        rootMeshCylinderRadius: 0,
        menuEl,
        wasMenuVisible: false,
        previousRootObjectScale: new THREE.Vector3().setFromMatrixScale(rootEl.object3D.matrixWorld),
        previousRootObjectQuaternion: new THREE.Quaternion().setFromRotationMatrix(
          currentRootObjectRotation.extractRotation(rootEl.object3D.matrixWorld)
        )
      });
    };
  })();
  unregister(menuPlacementRoot) {
    const index = this.data.findIndex(matchRootEl(menuPlacementRoot.el));
    if (index === -1) {
      console.error(
        "Tried to unregister a menu root that the system didn't know about. The root element was:",
        menuPlacementRoot.el
      );
      return;
    }
    this.data.splice(index, 1);
  }
  tickDatum = function() {
    const currentRootObjectScale = new THREE.Vector3();
    const currentRootObjectQuaternion = new THREE.Quaternion();
    const currentRootObjectRotation = new THREE.Matrix4();
    return function tickDatum(datum) {
      const rootMesh = datum.rootEl.getObject3D("mesh");
      if (!rootMesh) return;
      const isMenuVisible = datum.menuEl.object3D.visible;
      const isOpening = isMenuVisible && !datum.wasMenuVisible;
      datum.rootEl.object3D.updateMatrices();
      currentRootObjectScale.setFromMatrixScale(datum.rootEl.object3D.matrixWorld);
      const rootScaleChanged = !almostEqualVector3(datum.previousRootObjectScale, currentRootObjectScale);
      const menuIsAnimating = datum.menuEl.getAttribute("animation__show");
      const shouldRestartMenuAnimation = isOpening || (rootScaleChanged && menuIsAnimating);
      currentRootObjectQuaternion.setFromRotationMatrix(
        currentRootObjectRotation.extractRotation(datum.rootEl.object3D.matrixWorld)
      );
      const shouldRecomputeRootAabb =
        isMenuVisible &&
        (!datum.didComputeAabbAtLeastOnce ||
          (datum.previousRootMesh !== rootMesh ||
            almostEqualQuaternion(datum.previousRootQuaternion, currentRootObjectQuaternion)));
      if (shouldRecomputeRootAabb) {
        computeObjectAABB(rootMesh, datum.rootMeshAABB);
        datum.rootMeshCylinderRadius =
          Math.max(
            Math.abs(datum.rootMeshAABB.max.x - datum.rootMeshAABB.min.x),
            Math.abs(datum.rootMeshAABB.max.z - datum.rootMeshAABB.min.z),
            0.025
          ) / 2;
      }
      if (shouldRestartMenuAnimation) {
        restartMenuAnimation(datum.menuEl, menuIsAnimating);
      }

      datum.previousRootMesh = rootMesh;
      datum.wasMenuVisible = isMenuVisible;
      datum.previousRootObjectScale.copy(currentRootObjectScale);
      datum.previousRootObjectQuaternion.copy(currentRootObjectQuaternion);
    };
  };
  tick() {
    for (let i = 0; i < this.data.length; i++) {
      this.tickDatum(this.data[i]);
    }
  }
}
