/* global Ammo */
import { setMatrixWorld, almostEqualVector3, almostEqualQuaternion } from "../utils/three-utils";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { computeObjectAABB } from "../utils/auto-box-collider";
const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;

AFRAME.registerComponent("menu-placement-root", {
  schema: {
    menuSelector: { type: "string" }
  },
  init() {
    this.system = this.el.sceneEl.systems["hubs-systems"].menuPlacementSystem;
    this.didRegisterWithSystem = false;
  },
  tick() {
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

const restartMenuAnimation = (function() {
  const menuPosition = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();
  const difference = new THREE.Vector3();
  return function restartMenuAnimation(menuEl, viewingCamera, parentScale, menuIsAnimating) {
    if (menuIsAnimating) {
      menuEl.removeAttribute("animation__show");
    }
    menuEl.object3D.updateMatrices();
    viewingCamera.updateMatrices();
    menuPosition.setFromMatrixPosition(menuEl.object3D.matrixWorld);
    cameraPosition.setFromMatrixPosition(viewingCamera.matrixWorld);
    const distance = difference.subVectors(menuPosition, cameraPosition).length();
    const toScale = (0.5 * distance) / parentScale;
    const fromScale = toScale * 0.8;
    menuEl.setAttribute("animation__show", {
      property: "scale",
      dur: 300,
      from: { x: fromScale, y: fromScale, z: fromScale },
      to: { x: toScale, y: toScale, z: toScale },
      easing: "easeOutElastic"
    });
    menuEl.object3D.matrixNeedsUpdate = true;
  };
})();

const recomputeRootAABBInfo = (function() {
  const rootPosition = new THREE.Vector3();
  const rootMeshCylinderCenter = new THREE.Vector3();
  return function recomputeRootAABBInfo(datum, rootMesh) {
    computeObjectAABB(rootMesh, datum.rootMeshAABB);
    datum.rootMeshCylinderRadius =
      Math.max(
        Math.abs(datum.rootMeshAABB.max.x - datum.rootMeshAABB.min.x),
        Math.abs(datum.rootMeshAABB.max.z - datum.rootMeshAABB.min.z),
        0.025
      ) / 2;
    rootMeshCylinderCenter.addVectors(datum.rootMeshAABB.min, datum.rootMeshAABB.max).multiplyScalar(0.5);
    datum.rootEl.object3D.updateMatrices();
    rootPosition.setFromMatrixPosition(datum.rootEl.object3D.matrixWorld);
    datum.rootEl.object3D.worldToLocal(
      datum.rootToCylinderCenterInRootSpace.subVectors(rootMeshCylinderCenter, rootPosition)
    );
    datum.didComputeRootAABBInfoAtLeastOnce = true;
  };
})();

function isVisibleUpToRoot(node, root) {
  if (node === root) return true;
  if (!node.visible) return false;
  return isVisibleUpToRoot(node.parent, root);
}

const recomputeMenuShapeInfo = (function() {
  const menuPosition = new THREE.Vector3();
  const menuQuaternion = new THREE.Quaternion();
  const initialScale = new THREE.Vector3();
  const temporaryScale = new THREE.Vector3();
  const initialMenuTransform = new THREE.Matrix4();
  const temporaryMenuTransform = new THREE.Matrix4();
  const menuRotation = new THREE.Matrix4();
  const menuRight = new THREE.Vector3();
  const menuUp = new THREE.Vector3();
  const vertex = new THREE.Vector3();
  const menuPositionToVertex = new THREE.Vector3();
  return function recomputeMenuShapeInfo(datum, positionAtCylinderBorder, desiredMenuQuaternion) {
    const menu = datum.menuEl.object3D;
    menu.updateMatrices();
    menu.matrixWorld.decompose(menuPosition, menuQuaternion, initialScale);
    temporaryMenuTransform.compose(
      positionAtCylinderBorder,
      desiredMenuQuaternion,
      temporaryScale.set(1, 1, 1)
    );
    setMatrixWorld(menu, temporaryMenuTransform);
    menuRotation.extractRotation(menu.matrixWorld);
    menuRight
      .set(1, 0, 0)
      .applyMatrix4(menuRotation)
      .normalize();
    menuUp
      .set(0, 1, 0)
      .applyMatrix4(menuRotation)
      .normalize();

    let minRight = 0;
    let maxRight = 0;
    let minUp = 0;
    let maxUp = 0;
    menu.traverse(node => {
      if (!isVisibleUpToRoot(node, menu)) return;
      node.updateMatrices();
      if (node.geometry) {
        if (node.geometry.isGeometry) {
          for (let i = 0; i < node.geometry.vertices; i++) {
            vertex.copy(node.geometry.vertices[i]);
            vertex.applyMatrix4(node.matrixWorld);
            if (isNaN(vertex.x)) continue;
            menuPositionToVertex.subVectors(vertex, menuPosition);
            const dotUp = menuUp.dot(menuPositionToVertex);
            const dotRight = menuRight.dot(menuPositionToVertex);
            maxUp = Math.max(maxUp, dotUp);
            minUp = Math.min(minUp, dotUp);
            maxRight = Math.max(maxRight, dotRight);
            minRight = Math.min(minRight, dotRight);
          }
        } else if (node.geometry.isBufferGeometry && node.geometry.attributes.position) {
          for (let i = 0; i < node.geometry.attributes.position.count; i++) {
            vertex.fromBufferAttribute(node.geometry.attributes.position, i);
            vertex.applyMatrix4(node.matrixWorld);
            if (isNaN(vertex.x)) continue;
            menuPositionToVertex.subVectors(vertex, menuPosition);
            const dotUp = menuUp.dot(menuPositionToVertex);
            const dotRight = menuRight.dot(menuPositionToVertex);
            maxUp = Math.max(maxUp, dotUp);
            minUp = Math.min(minUp, dotUp);
            maxRight = Math.max(maxRight, dotRight);
            minRight = Math.min(minRight, dotRight);
          }
        }
      }
    });
    setMatrixWorld(
      menu,
      initialMenuTransform.compose(
        menuPosition,
        menuQuaternion,
        initialScale
      )
    );
    datum.menuMinUp = minUp;
    datum.menuMaxUp = maxUp;
    datum.menuMinRight = minRight;
    datum.menuMaxRight = maxRight;
    datum.didComputeMenuShapeInfoAtLeastOnce = true;
  };
})();

const createRotationFromUpAndForward = (function() {
  const right = new THREE.Vector3();
  const backward = new THREE.Vector3();
  return function createRotationFromUpAndForward(up, forward, inMat4) {
    return inMat4.makeBasis(right.crossVectors(forward, up), up, backward.copy(forward).multiplyScalar(-1));
  };
})();

const UP = new THREE.Vector3(0, 1, 0);
const createFunctionToRecomputeMenuPlacement = function() {
  const cameraPosition = new THREE.Vector3();
  const centerToCamera = new THREE.Vector3();
  const centerToCylinderBorderDirection = new THREE.Vector3();
  const cylinderBorderToCenterDirection = new THREE.Vector3();
  const centerToCylinderBorder = new THREE.Vector3();
  const positionAtCylinderBorder = new THREE.Vector3();
  const menuBtHalfExtents = new Ammo.btVector3(0, 0, 0);
  //const menuBtBoxShape = new Ammo.btBoxShape(menuBtHalfExtents);
  const menuBtFromTransform = new Ammo.btTransform();
  const menuBtQuaternion = new Ammo.btQuaternion();
  const menuBtScale = new Ammo.btVector3();
  const menuBtToTransform = new Ammo.btTransform();
  //  const menuBtClosestConvexResultCallback = new Ammo.ClosestConvexResultCallback(
  //    menuBtFromTransform.getOrigin(),
  //    menuBtToTransform.getOrigin()
  //  );
  const desiredMenuTransform = new THREE.Matrix4();
  const menuWorldScale = new THREE.Vector3();
  const desiredMenuPosition = new THREE.Vector3();
  const desiredMenuRotation = new THREE.Matrix4();
  const desiredMenuQuaternion = new THREE.Quaternion();
  const menuTransformAtCylinderBorder = new THREE.Matrix4();
  const rootMeshCylinderCenter = new THREE.Vector3();
  const rootToCylinderCenterInWorldSpace = new THREE.Vector3();
  const rootPosition = new THREE.Vector3();

  return function recomputeMenuPlacement(datum, camera, btCollisionWorld) {
    camera.updateMatrices();
    cameraPosition.setFromMatrixPosition(camera.matrixWorld);
    datum.rootEl.object3D.updateMatrices();
    rootPosition.setFromMatrixPosition(datum.rootEl.object3D.matrixWorld);
    datum.rootEl.object3D.localToWorld(rootToCylinderCenterInWorldSpace.copy(datum.rootToCylinderCenterInRootSpace));
    rootMeshCylinderCenter.addVectors(rootPosition, rootToCylinderCenterInWorldSpace);
    centerToCamera.subVectors(cameraPosition, rootMeshCylinderCenter);
    centerToCylinderBorderDirection
      .copy(centerToCamera)
      .projectOnPlane(UP)
      .normalize();
    cylinderBorderToCenterDirection.copy(centerToCylinderBorderDirection).multiplyScalar(-1);
    centerToCylinderBorder.copy(centerToCylinderBorderDirection).multiplyScalar(datum.rootMeshCylinderRadius);
    positionAtCylinderBorder.addVectors(rootMeshCylinderCenter, centerToCylinderBorder);
    createRotationFromUpAndForward(UP, cylinderBorderToCenterDirection, desiredMenuRotation);
    desiredMenuQuaternion.setFromRotationMatrix(desiredMenuRotation);
    const shouldRecomputeMenuShapeInfo = !datum.didComputeMenuShapeInfoAtLeastOnce;
    if (shouldRecomputeMenuShapeInfo) {
      recomputeMenuShapeInfo(datum, positionAtCylinderBorder, desiredMenuQuaternion);
    }
    datum.menuEl.object3D.updateMatrices();
    menuWorldScale.setFromMatrixScale(datum.menuEl.object3D.matrixWorld);
    setMatrixWorld(
      datum.menuEl.object3D,
      menuTransformAtCylinderBorder.compose(
        positionAtCylinderBorder,
        desiredMenuQuaternion,
        menuWorldScale
      )
    );

    menuBtHalfExtents.setValue(
      (datum.menuMaxRight - datum.menuMinRight) / 2,
      (datum.menuMaxUp - datum.menuMinUp) / 2,
      0.005
    );
    const newMenuBtBoxShape = new Ammo.btBoxShape(menuBtHalfExtents); // TODO: Should not need to create new box shape
    menuBtFromTransform.setIdentity();
    menuBtFromTransform
      .getOrigin()
      .setValue(positionAtCylinderBorder.x, positionAtCylinderBorder.y, positionAtCylinderBorder.z);
    menuBtQuaternion.setValue(
      desiredMenuQuaternion.x,
      desiredMenuQuaternion.y,
      desiredMenuQuaternion.z,
      desiredMenuQuaternion.w
    );
    menuBtFromTransform.setRotation(menuBtQuaternion);
    menuBtScale.setValue(menuWorldScale.x, menuWorldScale.y, menuWorldScale.z);
    newMenuBtBoxShape.setLocalScaling(menuBtScale);
    menuBtToTransform.setIdentity();
    menuBtToTransform
      .getOrigin()
      .setValue(rootMeshCylinderCenter.x, rootMeshCylinderCenter.y, rootMeshCylinderCenter.z);
    menuBtToTransform.setRotation(menuBtQuaternion);
    const newBtClosestConvexResultCallback = new Ammo.ClosestConvexResultCallback(
      menuBtFromTransform.getOrigin(),
      menuBtToTransform.getOrigin()
    ); // TODO: Should not need to create new callback
    newBtClosestConvexResultCallback.set_m_collisionFilterGroup(COLLISION_LAYERS.HANDS); // HANDS seem to always allowed to interact with INTERACTABLES. How long until this comment is out of date?
    newBtClosestConvexResultCallback.set_m_collisionFilterMask(COLLISION_LAYERS.INTERACTABLES);
    btCollisionWorld.convexSweepTest(
      newMenuBtBoxShape,
      menuBtFromTransform,
      menuBtToTransform,
      newBtClosestConvexResultCallback,
      0.01
    );
    desiredMenuPosition.lerpVectors(
      positionAtCylinderBorder,
      rootMeshCylinderCenter,
      newBtClosestConvexResultCallback.get_m_closestHitFraction() - 0.01 // Pull back from the hit point just a bit, because of the fudge factor in the convexSweepTest
    );
    desiredMenuTransform.compose(
      desiredMenuPosition,
      desiredMenuQuaternion,
      menuWorldScale
    ); //TODO: Set size of menu
    setMatrixWorld(datum.menuEl.object3D, desiredMenuTransform);
  };
};

export class MenuPlacementSystem {
  constructor(physicsSystem) {
    this.physicsSystem = physicsSystem;
    this.data = [];
    this.tick = this.tick.bind(this);
    this.tickDatum = this.tickDatum.bind(this);
    this.register = this.register.bind(this);
    this.unregister = this.unregister.bind(this);
    waitForDOMContentLoaded().then(() => {
      this.viewingCamera = document.getElementById("viewing-camera").object3D;
    });
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
      menuEl.addEventListener("animationcomplete", () => {
        menuEl.removeAttribute("animation__show");
      });
      this.data.push({
        rootEl,
        previousRootMesh: rootEl.getObject3D("mesh"),
        previousRootObjectScale: new THREE.Vector3().setFromMatrixScale(rootEl.object3D.matrixWorld),
        previousRootObjectQuaternion: new THREE.Quaternion().setFromRotationMatrix(
          currentRootObjectRotation.extractRotation(rootEl.object3D.matrixWorld)
        ),
        rootToCylinderCenterInRootSpace: new THREE.Vector3(),
        didComputeRootAABBInfoAtLeastOnce: false,
        rootMeshAABB: new THREE.Box3(),
        rootMeshCylinderRadius: 0,
        menuEl,
        didComputeMenuShapeInfoAtLeastOnce: false,
        wasMenuVisible: false
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
  tickDatum = (function() {
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
      const shouldRecomputeRootAABBInfo =
        isMenuVisible &&
        (!datum.didComputeRootAABBInfoAtLeastOnce ||
          (datum.previousRootMesh !== rootMesh ||
            !almostEqualQuaternion(datum.previousRootObjectQuaternion, currentRootObjectQuaternion)));
      if (true || shouldRecomputeRootAABBInfo) {
        console.log("recomputeRootAABBInfo");
        recomputeRootAABBInfo(datum, rootMesh);
      }
      const shouldRecomputeMenuPlacement = isMenuVisible;
      if (true || shouldRecomputeMenuPlacement) {
        this.recomputeMenuPlacement(datum, this.viewingCamera, this.btCollisionWorld);
      }
      if (shouldRestartMenuAnimation) {
        console.log("restartMenuAnimation");
        restartMenuAnimation(datum.menuEl, this.viewingCamera, currentRootObjectScale.x, menuIsAnimating);
      }
      datum.previousRootMesh = rootMesh;
      datum.wasMenuVisible = isMenuVisible;
      datum.previousRootObjectScale.copy(currentRootObjectScale);
      datum.previousRootObjectQuaternion.copy(currentRootObjectQuaternion);
    };
  })();
  tick() {
    if (!this.viewingCamera) {
      return;
    }
    if (!(this.physicsSystem.world && this.physicsSystem.world.physicsWorld)) {
      return;
    }
    if (!this.didThingAfterAmmoInitialized) {
      this.didThingAfterAmmoInitialized = true;
      this.recomputeMenuPlacement = createFunctionToRecomputeMenuPlacement();
    }
    this.btCollisionWorld = this.btCollisionWorld || this.physicsSystem.world.physicsWorld;
    for (let i = 0; i < this.data.length; i++) {
      this.tickDatum(this.data[i]);
    }
  }
}
