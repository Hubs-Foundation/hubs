/* global Ammo */
import { setMatrixWorld } from "../utils/three-utils";
import { waitForDOMContentLoaded } from "../utils/async-utils";
const SWEEP_TEST_LAYER = require("../constants").COLLISION_LAYERS.CONVEX_SWEEP_TEST;
const HIT_FRACTION_FUDGE_FACTOR = 0.02;
const DISABLE_PERFORMANCE_OPTIMIZATIONS = false;

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
  return function calculateBoundaryPlacementInfo(cameraPosition, infoIn, infoOut) {
    const mesh = infoIn.rootMesh;
    mesh.updateMatrices();
    mesh.matrixWorld.decompose(meshPosition, meshQuaternion, meshScale);
    meshRotation.extractRotation(mesh.matrixWorld);
    meshToCenter
      .copy(infoIn.localMeshToCenterDir)
      .applyMatrix4(meshRotation)
      .multiplyScalar(meshScale.x * infoIn.distanceToCenterDividedByMeshScale);
    infoOut.centerOfBoundingSphere.addVectors(meshPosition, meshToCenter);
    centerToCameraDirection.subVectors(cameraPosition, infoOut.centerOfBoundingSphere).normalize();
    infoOut.positionAtBoundary.addVectors(
      infoOut.centerOfBoundingSphere,
      centerToPositionAtBoundary
        .copy(centerToCameraDirection)
        .multiplyScalar(meshScale.x * infoIn.radiusDividedByMeshScale)
    );
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
  return function recomputeMenuShapeInfo(datum, desiredMenuQuaternion) {
    const menu = datum.menuEl.object3D;
    menu.updateMatrices();
    menu.matrixWorld.decompose(menuPosition, menuQuaternion, initialScale);
    temporaryMenuTransform.compose(menuPosition, desiredMenuQuaternion, temporaryScale.set(1, 1, 1));
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
    setMatrixWorld(menu, initialMenuTransform.compose(menuPosition, menuQuaternion, initialScale));
    datum.menuMinUp = minUp;
    datum.menuMaxUp = maxUp;
    datum.menuMinRight = minRight;
    datum.menuMaxRight = maxRight;
    datum.didComputeMenuShapeInfoAtLeastOnce = true;
  };
})();

let doConvexSweepTest;
const createFunctionForConvexSweepTest = function() {
  const menuBtHalfExtents = new Ammo.btVector3(0, 0, 0);
  const menuBtFromTransform = new Ammo.btTransform();
  const menuBtQuaternion = new Ammo.btQuaternion();
  const menuBtScale = new Ammo.btVector3();
  const menuBtToTransform = new Ammo.btTransform();
  return function doConvexSweepTest(info, btCollisionWorld) {
    menuBtHalfExtents.setValue(
      (info.menuMaxRight - info.menuMinRight) / 2,
      (info.menuMaxUp - info.menuMinUp) / 2,
      0.001
    );
    const menuBtBoxShape = new Ammo.btBoxShape(menuBtHalfExtents); // TODO: (performance) Do not recreate this every time
    menuBtFromTransform.setIdentity();
    menuBtFromTransform
      .getOrigin()
      .setValue(info.positionAtBoundary.x, info.positionAtBoundary.y, info.positionAtBoundary.z);
    menuBtQuaternion.setValue(
      info.desiredMenuQuaternion.x,
      info.desiredMenuQuaternion.y,
      info.desiredMenuQuaternion.z,
      info.desiredMenuQuaternion.w
    );
    menuBtFromTransform.setRotation(menuBtQuaternion);
    menuBtScale.setValue(info.menuWorldScale.x, info.menuWorldScale.y, info.menuWorldScale.z);
    menuBtBoxShape.setLocalScaling(menuBtScale);
    menuBtToTransform.setIdentity();
    menuBtToTransform
      .getOrigin()
      .setValue(info.centerOfBoundingSphere.x, info.centerOfBoundingSphere.y, info.centerOfBoundingSphere.z);
    menuBtToTransform.setRotation(menuBtQuaternion);

    const bodyHelper = info.rootEl.components["body-helper"];
    if (!bodyHelper) {
      console.error("No body-helper component found on root element. Cannot place the menu!", info.rootEl);
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
  const desiredMenuPosition = new THREE.Vector3();
  const menuTransformAtBorder = new THREE.Matrix4();
  const boundaryInfoIn = {
    rootMesh: null,
    localMeshToCenterDir: new THREE.Vector3(),
    distanceToCenterDividedByMeshScale: 0,
    radiusDividedByMeshScale: 0
  };
  const boundaryInfoOut = {
    centerOfBoundingSphere: new THREE.Vector3(),
    positionAtBoundary: new THREE.Vector3(),
    menuForwardDir: new THREE.Vector3()
  };
  const convexSweepInfo = {
    menuMaxRight: 0,
    menuMinRight: 0,
    menuMaxUp: 0,
    menuMinUp: 0,
    positionAtBoundary: new THREE.Vector3(),
    menuWorldScale: new THREE.Vector3(),
    centerOfBoundingSphere: new THREE.Vector3(),
    desiredMenuQuaternion: new THREE.Quaternion(),
    rootEl: null
  };
  const desiredMenuTransform = new THREE.Matrix4();

  return function recomputeMenuPlacement(datum, cameraPosition, cameraRotation, btCollisionWorld, boundingSphereInfo) {
    boundaryInfoIn.rootMesh = datum.rootMesh;
    boundaryInfoIn.localMeshToCenterDir.copy(boundingSphereInfo.localMeshToCenterDir);
    boundaryInfoIn.distanceToCenterDividedByMeshScale = boundingSphereInfo.distanceToCenterDividedByMeshScale;
    boundaryInfoIn.radiusDividedByMeshScale = boundingSphereInfo.radiusDividedByMeshScale;
    calculateBoundaryPlacementInfo(cameraPosition, boundaryInfoIn, boundaryInfoOut);
    convexSweepInfo.desiredMenuQuaternion.setFromRotationMatrix(cameraRotation);
    const shouldRecomputeMenuShapeInfo = !datum.didComputeMenuShapeInfoAtLeastOnce;
    if (DISABLE_PERFORMANCE_OPTIMIZATIONS || shouldRecomputeMenuShapeInfo) {
      recomputeMenuShapeInfo(datum, convexSweepInfo.desiredMenuQuaternion);
      // TODO: Recompute menu shape info when button visibility changes,
      // e.g. when the track/focus buttons become active after spawning a camera.
    }
    datum.menuEl.object3D.updateMatrices();
    convexSweepInfo.menuWorldScale.setFromMatrixScale(datum.menuEl.object3D.matrixWorld);
    setMatrixWorld(
      datum.menuEl.object3D,
      menuTransformAtBorder.compose(
        boundaryInfoOut.positionAtBoundary,
        convexSweepInfo.desiredMenuQuaternion,
        convexSweepInfo.menuWorldScale
      )
    );

    convexSweepInfo.menuMaxRight = datum.menuMaxRight;
    convexSweepInfo.menuMinRight = datum.menuMinRight;
    convexSweepInfo.menuMaxUp = datum.menuMaxUp;
    convexSweepInfo.menuMinUp = datum.menuMinUp;
    convexSweepInfo.positionAtBoundary.copy(boundaryInfoOut.positionAtBoundary);
    convexSweepInfo.centerOfBoundingSphere.copy(boundaryInfoOut.centerOfBoundingSphere);
    convexSweepInfo.rootEl = datum.rootEl;
    // TODO: (performance) We do not need to do the convexSweepTest every frame.
    // We can stagger it based on time since last sweep or when the camera or
    // mesh transforms change by some amount, and we can round-robin when necessary.
    const hitFraction = doConvexSweepTest(convexSweepInfo, btCollisionWorld);
    desiredMenuPosition.lerpVectors(
      boundaryInfoOut.positionAtBoundary,
      boundaryInfoOut.centerOfBoundingSphere,
      hitFraction
    );
    desiredMenuTransform.compose(
      desiredMenuPosition,
      convexSweepInfo.desiredMenuQuaternion,
      convexSweepInfo.menuWorldScale
    );
    setMatrixWorld(datum.menuEl.object3D, desiredMenuTransform);
    // TODO: If the camera is between desiredMenuPosition and centerOfBoundingSphere,
    // then a new menu position should be chosen such that it is not in the opposite
    // direction as the object is from the camera. In this case it is probably better
    // to allow the menu to intersect the mesh, and possibly draw it on top by changing
    // the render order.
  };
})();

function matchRootEl(rootEl) {
  return function match(tuple) {
    return tuple.rootEl === rootEl;
  };
}

// TODO: Computing the boundaries of skinned/animated meshes does not work correctly.
// TODO: Cloning small objects sometimes results in the menu placement failing by
// intersecting the mesh. However, when the objects are pinned and page is reloaded,
// the menu placement algorithm works fine.
export class MenuPlacementSystem {
  constructor(boundingSphereSystem, physicsSystem) {
    this.boundingSphereSystem = boundingSphereSystem;
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
    return function register(rootEl, menuEl) {
      this.data.push({
        rootEl,
        rootMesh: null,
        menuOpenTime: 0,
        startScaleAtMenuOpenTime: 0,
        menuEl,
        didComputeMenuShapeInfoAtLeastOnce: false,
        wasMenuVisible: false
      });
    };
  })();
  unregister(rootEl) {
    const index = this.data.findIndex(matchRootEl(rootEl));
    if (index === -1) {
      console.error("Tried to unregister a menu root that the system didn't know about. The root element was:", rootEl);
      return;
    }
    this.data.splice(index, 1);
  }
  tickDatum = (function() {
    return function tickDatum(cameraPosition, cameraRotation, datum) {
      datum.rootMesh = datum.rootEl.getObject3D("mesh");
      if (!datum.rootMesh) {
        return;
      }
      datum.rootEl.object3D.updateMatrices();
      datum.menuEl.object3D.updateMatrices();
      const isMenuVisible = datum.menuEl.object3D.visible;
      const shouldRecomputeMenuPlacement = isMenuVisible;
      if (DISABLE_PERFORMANCE_OPTIMIZATIONS || shouldRecomputeMenuPlacement) {
        const boundingSphereInfo = this.boundingSphereSystem.data.get(datum.rootEl).boundingSphereInfo;
        recomputeMenuPlacement(datum, cameraPosition, cameraRotation, this.btCollisionWorld, boundingSphereInfo);
      }
    };
  })();

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
        // Must wait for Ammo / WASM initialization in order
        // to initialize Ammo data structures like Ammo.btVector3
        this.didInitializeAfterAmmo = true;
        doConvexSweepTest = createFunctionForConvexSweepTest();
      }
      this.viewingCamera.updateMatrices();
      cameraPosition.setFromMatrixPosition(this.viewingCamera.matrixWorld);
      cameraRotation.extractRotation(this.viewingCamera.matrixWorld);
      this.btCollisionWorld = this.btCollisionWorld || this.physicsSystem.world.physicsWorld;
      for (let i = 0; i < this.data.length; i++) {
        this.tickDatum(cameraPosition, cameraRotation, this.data[i]);
      }
    };
  })();
}
