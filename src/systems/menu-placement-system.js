/* global Ammo */
import { setMatrixWorld, isAlmostUniformVector3 } from "../utils/three-utils";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { computeObjectAABB } from "../utils/auto-box-collider";
import { v3String } from "../utils/pretty-print";
import { elasticOut } from "../utils/easing";
const SWEEP_TEST_LAYER = require("../constants").COLLISION_LAYERS.CONVEX_SWEEP_TEST;
const FRACTION_FUDGE_FACTOR = 0.02; // Pull back from the hit point just a bit, because of the fudge factor in the convexSweepTest
const MENU_ANIMATION_DURATION_MS = 750;

AFRAME.registerComponent("menu-placement-root", {
  schema: {
    menuSelector: { type: "string" }
  },
  init() {
    this.system = this.el.sceneEl.systems["hubs-systems"].menuPlacementSystem;
    this.didRegisterWithSystem = false;
  },
  // Can't register with the system in init() or play() because menus do not seem to exist
  // under elements loaded from objects.gltf (The pinned room objects).
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

function isFlatMedia(el) {
  return !!(el.components["media-image"] || el.components["media-video"] || el.components["media-pdf"]);
}

const getBoundingSphereInfo = (function() {
  const AABB = new THREE.Box3();
  const center = new THREE.Vector3();
  const v = new THREE.Vector3();
  const sphere = new THREE.Sphere();
  const meshPosition = new THREE.Vector3();
  const meshQuaternion = new THREE.Quaternion();
  const meshScale = new THREE.Vector3();
  const meshRotation = new THREE.Matrix4();
  const meshRotationInverse = new THREE.Matrix4();
  const meshPositionToCenter = new THREE.Vector3();
  return function getBoundingSphereInfo(datum) {
    const mesh = datum.rootMesh;
    mesh.updateMatrices();
    computeObjectAABB(mesh, AABB);
    center.addVectors(AABB.min, AABB.max).multiplyScalar(0.5);
    const radius = v.subVectors(AABB.max, AABB.min).length() / 2;
    sphere.set(center, radius);
    mesh.matrixWorld.decompose(meshPosition, meshQuaternion, meshScale);
    meshRotation.extractRotation(mesh.matrixWorld);
    meshPositionToCenter.subVectors(center, meshPosition);
    const distanceToCenter = meshPositionToCenter.length();
    datum.localMeshToCenterDir
      .copy(meshPositionToCenter)
      .applyMatrix4(meshRotationInverse.getInverse(meshRotation))
      .normalize();

    if (!isFlatMedia(datum.rootEl) && !isAlmostUniformVector3(meshScale, 0.005)) {
      // TODO: Only place the menus on the front and back of flat media.
      console.warn(
        "Non-uniform scale detected unexpectedly on an object3D. Menu placement may fail!\n",
        v3String(meshScale),
        mesh,
        datum.rootEl
      );
      //TODO: As far as I can tell, we control the scale of these nodes, and
      // always expect them to be uniform. Supporting non-uniform scale requires
      // a different code path without the same performance optimizations.
    }
    const meshScaleX = meshScale.x;
    datum.distanceToCenterDividedByMeshScale = distanceToCenter / meshScaleX;
    datum.radiusDividedByMeshScale = radius / meshScaleX;
    datum.didGetBoundingSphereInfoAtLeastOnce = true;
  };
})();

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
    temporaryMenuTransform.compose(
      menuPosition,
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
    Ammo.destroy(menuBtBoxShape); //TODO: Is this how I'm supposed to free this memory?
    Ammo.destroy(menuBtClosestConvexResultCallback);
    const fractionToUse = closestHitFraction === 1 ? 0 : closestHitFraction - FRACTION_FUDGE_FACTOR; // If the fraction is 1, then we didn't collide at all. In that case, choose a number near 0 (or 0 itself) to place it at the edge of the bounding sphere.
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

  return function recomputeMenuPlacement(datum, cameraPosition, cameraRotation, btCollisionWorld) {
    boundaryInfoIn.rootMesh = datum.rootMesh;
    boundaryInfoIn.localMeshToCenterDir.copy(datum.localMeshToCenterDir);
    boundaryInfoIn.distanceToCenterDividedByMeshScale = datum.distanceToCenterDividedByMeshScale;
    boundaryInfoIn.radiusDividedByMeshScale = datum.radiusDividedByMeshScale;
    calculateBoundaryPlacementInfo(cameraPosition, boundaryInfoIn, boundaryInfoOut);
    convexSweepInfo.desiredMenuQuaternion.setFromRotationMatrix(cameraRotation);
    const shouldRecomputeMenuShapeInfo = !datum.didComputeMenuShapeInfoAtLeastOnce;
    if (shouldRecomputeMenuShapeInfo) {
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
        rootMesh: null,
        previousRootMesh: null,
        menuOpenTime: 0,
        startScaleAtMenuOpenTime: 0,
        localMeshToCenterDir: new THREE.Vector3(),
        distanceToCenterDividedByMeshScale: 0,
        didGetBoundingSphereInfoAtLeastOnce: false,
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
    const menuParentScale = new THREE.Vector3();
    const menuPosition = new THREE.Vector3();
    const menuToCamera = new THREE.Vector3();
    return function tickDatum(t, cameraPosition, cameraRotation, datum) {
      datum.rootMesh = datum.rootEl.getObject3D("mesh");
      if (!datum.rootMesh) {
        return;
      }
      datum.rootEl.object3D.updateMatrices();
      datum.menuEl.object3D.updateMatrices();
      const isMenuVisible = datum.menuEl.object3D.visible;
      const rootMeshChanged = datum.previousRootMesh !== datum.rootMesh;
      const shouldGetBoundingSphereInfo =
        isMenuVisible && (!datum.didGetBoundingSphereInfoAtLeastOnce || rootMeshChanged);
      if (shouldGetBoundingSphereInfo) {
        getBoundingSphereInfo(datum);
      }
      const shouldRecomputeMenuPlacement = isMenuVisible;
      if (shouldRecomputeMenuPlacement) {
        recomputeMenuPlacement(datum, cameraPosition, cameraRotation, this.btCollisionWorld);
      }
      const isMenuOpening = isMenuVisible && !datum.wasMenuVisible;
      const distanceToMenu = menuToCamera
        .subVectors(cameraPosition, menuPosition.setFromMatrixPosition(datum.menuEl.object3D.matrixWorld))
        .length();
      datum.menuEl.object3D.parent.updateMatrices();
      menuParentScale.setFromMatrixScale(datum.menuEl.object3D.parent.matrixWorld);
      const endingScale = (0.4 * distanceToMenu) / menuParentScale.x;
      if (isMenuOpening) {
        datum.menuOpenTime = t;
        datum.startScaleAtMenuOpenTime = endingScale * 0.8;
      }
      if (isMenuVisible) {
        const currentScale = THREE.Math.lerp(
          datum.startScaleAtMenuOpenTime,
          endingScale,
          elasticOut(THREE.Math.clamp((t - datum.menuOpenTime) / MENU_ANIMATION_DURATION_MS, 0, 1))
        );
        datum.menuEl.object3D.scale.setScalar(currentScale);
        datum.menuEl.object3D.matrixNeedsUpdate = true;
        // TODO: If scaling becomes a hotspot on mobile because all object menus open in freeze mode, we can round robin the scale updates.
      }
      datum.previousRootMesh = datum.rootMesh;
      datum.wasMenuVisible = isMenuVisible;
    };
  })();

  tick = (function() {
    const cameraPosition = new THREE.Vector3();
    const cameraRotation = new THREE.Matrix4();
    return function tick(t) {
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
        this.tickDatum(t, cameraPosition, cameraRotation, this.data[i]);
      }
    };
  })();
}
