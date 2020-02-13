/* global Ammo */
import { setMatrixWorld } from "../utils/three-utils";
import { waitForDOMContentLoaded } from "../utils/async-utils";
const SWEEP_TEST_LAYER = require("../constants").COLLISION_LAYERS.CONVEX_SWEEP_TEST;
const HIT_FRACTION_FUDGE_FACTOR = 0.02;

const calculateBoundaryPlacementInfo = (function() {
  const meshPosition = new THREE.Vector3();
  const meshQuaternion = new THREE.Quaternion();
  const meshRotation = new THREE.Matrix4();
  const meshScale = new THREE.Vector3();
  const meshToCenter = new THREE.Vector3();
  const centerToCameraDirection = new THREE.Vector3();
  const centerToPositionAtBoundary = new THREE.Vector3();
  // Calculate a position on the bounding sphere such that we could
  // place the menu there without intersecting the mesh.
  return function calculateBoundaryPlacementInfo(cameraPosition, mesh, boundingSphereInfo, infoOut) {
    mesh.updateMatrices();
    mesh.matrixWorld.decompose(meshPosition, meshQuaternion, meshScale);
    meshRotation.extractRotation(mesh.matrixWorld);
    meshToCenter
      .copy(boundingSphereInfo.localMeshToCenterDir)
      .applyMatrix4(meshRotation)
      .multiplyScalar(meshScale.x * boundingSphereInfo.distanceToCenterDividedByMeshScale);
    infoOut.centerOfBoundingSphere.addVectors(meshPosition, meshToCenter);
    centerToCameraDirection.subVectors(cameraPosition, infoOut.centerOfBoundingSphere).normalize();
    infoOut.positionAtBoundary.addVectors(
      infoOut.centerOfBoundingSphere,
      centerToPositionAtBoundary
        .copy(centerToCameraDirection)
        .multiplyScalar(meshScale.x * boundingSphereInfo.radiusDividedByMeshScale)
    );
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
    const fractionToUse =
      closestHitFraction === 1 ? 0 : THREE.Math.clamp(closestHitFraction - HIT_FRACTION_FUDGE_FACTOR, 0, 1);
    // Pull back from the hit point just a bit to guard against the convex sweep test allowing a small overlap.
    // If the fraction is 1, then we didn't collide at all. In that case, return 0 so we place the menu
    // at the edge of the bounding sphere.
    return fractionToUse;
  };
};

const recomputeMenuPlacement = (function() {
  const boundaryInfoOut = {
    centerOfBoundingSphere: new THREE.Vector3(),
    positionAtBoundary: new THREE.Vector3()
  };
  const desiredMenuPosition = new THREE.Vector3();
  const menuTransformAtBorder = new THREE.Matrix4();
  const menuWorldScale = new THREE.Vector3();
  const desiredMenuTransform = new THREE.Matrix4();
  const desiredMenuQuaternion = new THREE.Quaternion();

  return function recomputeMenuPlacement(
    el,
    datum,
    cameraPosition,
    cameraRotation,
    btCollisionWorld,
    boundingSphereInfo
  ) {
    calculateBoundaryPlacementInfo(cameraPosition, datum.mesh, boundingSphereInfo, boundaryInfoOut);
    desiredMenuQuaternion.setFromRotationMatrix(cameraRotation);
    const shouldComputeMenuHalfExtents = !datum.didComputeMenuHalfExtents;
    if (shouldComputeMenuHalfExtents) {
      datum.didComputeMenuHalfExtents = true;
      // TODO: Recompute menu shape info when button visibility changes,
      // e.g. when the track/focus buttons become active after spawning a camera.
      calculateMenuHalfExtents(datum.menuEl.object3D, datum.menuHalfExtents);
    }
    datum.menuEl.object3D.updateMatrices();
    menuWorldScale.setFromMatrixScale(datum.menuEl.object3D.matrixWorld);
    setMatrixWorld(
      datum.menuEl.object3D,
      menuTransformAtBorder.compose(
        boundaryInfoOut.positionAtBoundary,
        desiredMenuQuaternion,
        menuWorldScale
      )
    );

    // TODO: (performance) We do not need to do the convexSweepTest every frame.
    // We can stagger it based on time since last sweep or when the camera or
    // mesh transforms change by some amount, and we can round-robin when necessary.
    const hitFraction = doConvexSweepTest(
      btCollisionWorld,
      el,
      datum.menuHalfExtents,
      boundaryInfoOut.positionAtBoundary,
      menuWorldScale,
      boundaryInfoOut.centerOfBoundingSphere,
      desiredMenuQuaternion
    );
    desiredMenuPosition.lerpVectors(
      boundaryInfoOut.positionAtBoundary,
      boundaryInfoOut.centerOfBoundingSphere,
      hitFraction
    );
    desiredMenuTransform.compose(
      desiredMenuPosition,
      desiredMenuQuaternion,
      menuWorldScale
    );
    setMatrixWorld(datum.menuEl.object3D, desiredMenuTransform);
    // TODO: If the camera is between desiredMenuPosition and centerOfBoundingSphere,
    // then a new menu position should be chosen such that it is not in the opposite
    // direction as the object is from the camera. In this case it is probably better
    // to allow the menu to intersect the mesh, and possibly draw it on top by changing
    // the render order.
  };
})();

// TODO: Computing the boundaries of skinned/animated meshes does not work correctly.
// TODO: Cloning small objects sometimes results in the menu placement failing by
// intersecting the mesh. However, when the objects are pinned and page is reloaded,
// the menu placement algorithm works fine.
export class MenuPlacementSystem {
  constructor(boundingSphereSystem, physicsSystem) {
    this.boundingSphereSystem = boundingSphereSystem;
    this.physicsSystem = physicsSystem;
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
      menuHalfExtents: new THREE.Vector3()
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
      this.viewingCamera.updateMatrices();
      cameraPosition.setFromMatrixPosition(this.viewingCamera.matrixWorld);
      cameraRotation.extractRotation(this.viewingCamera.matrixWorld);
      for (let i = 0; i < this.els.length; i++) {
        const el = this.els[i];
        const datum = this.data.get(el);
        datum.mesh = el.getObject3D("mesh");
        if (!datum.mesh) {
          continue;
        }
        const isMenuVisible = datum.menuEl.object3D.visible;
        const shouldRecomputeMenuPlacement = isMenuVisible;
        if (shouldRecomputeMenuPlacement) {
          const boundingSphereInfo = this.boundingSphereSystem.data.get(el).boundingSphereInfo;
          recomputeMenuPlacement(el, datum, cameraPosition, cameraRotation, this.btCollisionWorld, boundingSphereInfo);
        }
      }
    };
  })();
}
