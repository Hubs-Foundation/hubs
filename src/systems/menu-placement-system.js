/* global Ammo */
import { setMatrixWorld } from "../utils/three-utils";
import { waitForDOMContentLoaded } from "../utils/async-utils";
const SWEEP_TEST_LAYER = require("../constants").COLLISION_LAYERS.CONVEX_SWEEP_TEST;
const HIT_FRACTION_FUDGE_FACTOR = 0.02;

const calculateDesiredMenuQuaternion = (function() {
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const back = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const rotation = new THREE.Matrix4();
  return function calculateDesiredMenuQuaternion(
    isVR,
    cameraPosition,
    intersectionPoint,
    cameraRotation,
    desiredMenuQuaternion
  ) {
    if (isVR) {
      back.subVectors(cameraPosition, intersectionPoint).normalize();
    } else {
      back
        .set(0, 0, 1)
        .applyMatrix4(cameraRotation)
        .normalize();
    }
    up.set(0, 1, 0);
    forward.copy(back).multiplyScalar(-1);
    right.crossVectors(forward, up).normalize();
    up.crossVectors(right, forward);
    rotation.makeBasis(right, up, back);
    return desiredMenuQuaternion.setFromRotationMatrix(rotation);
  };
})();

function isVisibleUpToRoot(node, root) {
  if (node === root) return true;
  if (!node.visible) return false;
  return isVisibleUpToRoot(node.parent, root);
}

const calculateMenuHalfExtents = (function() {
  const menuRotation = new THREE.Matrix4();
  const menuRight = new THREE.Vector3();
  const menuUp = new THREE.Vector3();
  const vertex = new THREE.Vector3();
  return function calculateMenuHalfExtents(menu, halfExtents) {
    menu.updateMatrices();
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
            const dotUp = menuUp.dot(vertex);
            const dotRight = menuRight.dot(vertex);
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
            const dotUp = menuUp.dot(vertex);
            const dotRight = menuRight.dot(vertex);
            maxUp = Math.max(maxUp, dotUp);
            minUp = Math.min(minUp, dotUp);
            maxRight = Math.max(maxRight, dotRight);
            minRight = Math.min(minRight, dotRight);
          }
        }
      }
    });
    return halfExtents.set((maxRight - minRight) / 2, (maxUp - minUp) / 2, 0.001);
  };
})();

let doConvexSweepTest;
const createFunctionForConvexSweepTest = function() {
  const menuBtHalfExtents = new Ammo.btVector3(0, 0, 0);
  const menuBtFromTransform = new Ammo.btTransform();
  const menuBtQuaternion = new Ammo.btQuaternion();
  const menuBtScale = new Ammo.btVector3();
  const menuBtToTransform = new Ammo.btTransform();
  return function doConvexSweepTest(
    btCollisionWorld,
    el,
    menuHalfExtents,
    positionAtBoundary,
    menuWorldScale,
    centerOfBoundingSphere,
    desiredMenuQuaternion
  ) {
    menuBtHalfExtents.setValue(menuHalfExtents.x, menuHalfExtents.y, menuHalfExtents.z);
    const menuBtBoxShape = new Ammo.btBoxShape(menuBtHalfExtents); // TODO: (performance) Do not recreate this every time
    menuBtFromTransform.setIdentity();
    menuBtFromTransform.getOrigin().setValue(positionAtBoundary.x, positionAtBoundary.y, positionAtBoundary.z);
    menuBtQuaternion.setValue(
      desiredMenuQuaternion.x,
      desiredMenuQuaternion.y,
      desiredMenuQuaternion.z,
      desiredMenuQuaternion.w
    );
    menuBtFromTransform.setRotation(menuBtQuaternion);
    menuBtScale.setValue(menuWorldScale.x, menuWorldScale.y, menuWorldScale.z);
    menuBtBoxShape.setLocalScaling(menuBtScale);
    menuBtToTransform.setIdentity();
    menuBtToTransform
      .getOrigin()
      .setValue(centerOfBoundingSphere.x, centerOfBoundingSphere.y, centerOfBoundingSphere.z);
    menuBtToTransform.setRotation(menuBtQuaternion);

    const bodyHelper = el.components["body-helper"];
    if (!bodyHelper) {
      console.error("No body-helper component found on root element. Cannot place the menu!", el);
    }
    const group = bodyHelper.data.collisionFilterGroup;
    const mask = bodyHelper.data.collisionFilterMask;
    // We avoid using setAttribute for the collisionFilter data because
    // of the extra work that setAttribute does and because we do not need
    // to check for overlapping pairs:
    // https://github.com/InfiniteLee/three-ammo/blob/master/src/body.js#L219
    const broadphaseProxy = bodyHelper.body.physicsBody.getBroadphaseProxy();
    broadphaseProxy.set_m_collisionFilterGroup(SWEEP_TEST_LAYER);
    broadphaseProxy.set_m_collisionFilterMask(SWEEP_TEST_LAYER);
    const menuBtClosestConvexResultCallback = new Ammo.ClosestConvexResultCallback(
      menuBtFromTransform.getOrigin(),
      menuBtToTransform.getOrigin()
    ); // TODO: (performance) Do not recreate this every time
    menuBtClosestConvexResultCallback.set_m_collisionFilterGroup(SWEEP_TEST_LAYER);
    menuBtClosestConvexResultCallback.set_m_collisionFilterMask(SWEEP_TEST_LAYER);
    // TODO: (performance) Try creating a new Ammo.btDiscreteDynamicsWorld,
    // adding ONLY the menu and mesh rigid bodies,
    // then removing them after the convexSweepTest.
    btCollisionWorld.convexSweepTest(
      menuBtBoxShape,
      menuBtFromTransform,
      menuBtToTransform,
      menuBtClosestConvexResultCallback,
      0.01
    );
    broadphaseProxy.set_m_collisionFilterGroup(group);
    broadphaseProxy.set_m_collisionFilterMask(mask);
    const closestHitFraction = menuBtClosestConvexResultCallback.get_m_closestHitFraction();
    Ammo.destroy(menuBtBoxShape);
    Ammo.destroy(menuBtClosestConvexResultCallback);
    const fractionToUse = THREE.Math.clamp(closestHitFraction - HIT_FRACTION_FUDGE_FACTOR, 0, 1);
    // Pull back from the hit point just a bit to guard against the convex sweep test allowing a small overlap.
    return fractionToUse;
  };
};

const recomputeMenuPlacement = (function() {
  const desiredMenuPosition = new THREE.Vector3();
  const menuWorldScale = new THREE.Vector3();
  const menuParentScale = new THREE.Vector3();
  const desiredMenuTransform = new THREE.Matrix4();

  return function recomputeMenuPlacement(el, isVR, datum, cameraPosition, cameraRotation, btCollisionWorld) {
    const shouldComputeMenuHalfExtents = !datum.didComputeMenuHalfExtents;
    if (shouldComputeMenuHalfExtents) {
      datum.didComputeMenuHalfExtents = true;
      // TODO: Recompute menu shape info when button visibility changes,
      // e.g. when the track/focus buttons become active after spawning a camera.
      calculateMenuHalfExtents(datum.menuEl.object3D, datum.menuHalfExtents);
    }
    datum.menuEl.object3D.updateMatrices();
    menuParentScale.setFromMatrixScale(datum.menuEl.object3D.parent.matrixWorld);
    const distanceToMenu = new THREE.Vector3().subVectors(cameraPosition, datum.intersectionPoint).length();
    menuWorldScale.setScalar(0.45 * distanceToMenu);
    calculateDesiredMenuQuaternion(
      isVR,
      cameraPosition,
      datum.intersectionPoint,
      cameraRotation,
      datum.desiredMenuQuaternion
    );

    const hitFraction = doConvexSweepTest(
      btCollisionWorld,
      el,
      datum.menuHalfExtents,
      cameraPosition,
      menuWorldScale,
      datum.intersectionPoint,
      datum.desiredMenuQuaternion
    );
    if (hitFraction === 0) {
      desiredMenuPosition.lerpVectors(cameraPosition, datum.intersectionPoint, 0.8);
    } else {
      desiredMenuPosition.lerpVectors(cameraPosition, datum.intersectionPoint, hitFraction);
    }
    desiredMenuTransform.compose(
      desiredMenuPosition,
      datum.desiredMenuQuaternion,
      menuWorldScale
    );
    setMatrixWorld(datum.menuEl.object3D, desiredMenuTransform);
  };
})();

// TODO: Computing the boundaries of skinned/animated meshes does not work correctly.
// TODO: Cloning small objects sometimes results in the menu placement failing by
// intersecting the mesh. However, when the objects are pinned and page is reloaded,
// the menu placement algorithm works fine.
export class MenuPlacementSystem {
  constructor(physicsSystem, interactionSystem) {
    this.physicsSystem = physicsSystem;
    this.interactionSystem = interactionSystem;
    this.els = [];
    this.data = new Map();
    this.tick = this.tick.bind(this);
    waitForDOMContentLoaded().then(() => {
      this.viewingCamera = document.getElementById("viewing-camera").object3D;
    });
  }
  register(el, menuEl) {
    this.els.push(el);
    this.data.set(el, {
      mesh: null,
      menuEl,
      didComputeMenuHalfExtents: false,
      menuHalfExtents: new THREE.Vector3(),
      intersectionPoint: new THREE.Vector3(),
      desiredMenuQuaternion: new THREE.Quaternion()
    });
  }
  unregister(el) {
    this.els.splice(this.els.indexOf(el), 1);
    this.data.delete(el);
  }

  tick = (function() {
    const cameraPosition = new THREE.Vector3();
    const cameraRotation = new THREE.Matrix4();
    return function tick() {
      if (!this.viewingCamera) {
        return;
      }
      if (!Ammo || !(this.physicsSystem.world && this.physicsSystem.world.physicsWorld)) {
        return;
      }
      if (!this.didInitializeAfterAmmo) {
        // Must wait for Ammo / WASM initialization before we can
        // initialize Ammo data structures like Ammo.btVector3
        this.didInitializeAfterAmmo = true;
        doConvexSweepTest = createFunctionForConvexSweepTest();
        this.btCollisionWorld = this.physicsSystem.world.physicsWorld;
      }
      if (!this.leftCursorController) {
        this.leftCursorController = document.getElementById("left-cursor-controller").components["cursor-controller"];
        this.rightCursorController = document.getElementById("right-cursor-controller").components["cursor-controller"];
      }
      this.viewingCamera.updateMatrices();
      cameraPosition.setFromMatrixPosition(this.viewingCamera.matrixWorld);
      cameraRotation.extractRotation(this.viewingCamera.matrixWorld);
      for (let i = 0; i < this.els.length; i++) {
        const el = this.els[i];
        if (!el.components["gltf-model-plus"]) {
          continue;
        }
        const datum = this.data.get(el);
        datum.mesh = el.getObject3D("mesh");
        if (!datum.mesh) {
          continue;
        }
        const isMenuVisible = datum.menuEl.object3D.visible;
        const isMenuOpening = isMenuVisible && !datum.wasMenuVisible;
        if (isMenuOpening) {
          const intersection =
            (this.interactionSystem.state.rightRemote.hovered === el && this.rightCursorController.intersection) ||
            (this.interactionSystem.state.leftRemote.hovered === el && this.leftCursorController.intersection);
          if (!intersection) {
            // Must be on mobile, where all menus open simultaneously
            el.object3D.updateMatrices();
            datum.intersectionPoint.setFromMatrixPosition(el.object3D.matrixWorld);
          } else {
            datum.intersectionPoint.copy(intersection.point);
          }
          recomputeMenuPlacement(
            el,
            el.sceneEl.is("vr-mode"),
            datum,
            cameraPosition,
            cameraRotation,
            this.btCollisionWorld
          );
        }
        datum.wasMenuVisible = isMenuVisible;
      }
    };
  })();
}
