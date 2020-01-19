/* global Ammo */
import { setMatrixWorld, almostEqualVector3, isAlmostUniformVector3 } from "../utils/three-utils";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { computeObjectAABB } from "../utils/auto-box-collider";
import { v3String } from "../utils/pretty-print";
const SWEEP_TEST_LAYER = require("../constants").COLLISION_LAYERS.CONVEX_SWEEP_TEST;
const FRACTION_FUDGE_FACTOR = 0.02; // Pull back from the hit point just a bit, because of the fudge factor in the convexSweepTest
const UP = new THREE.Vector3(0, 1, 0);

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

function matchRootEl(rootEl) {
  return function match(tuple) {
    return tuple.rootEl === rootEl;
  };
}

function restartMenuAnimation(menuEl, menuIsAnimating, desiredScale) {
  if (menuIsAnimating) {
    menuEl.removeAttribute("animation__show");
  }
  const startingScale = desiredScale * 0.8;
  menuEl.setAttribute("animation__show", {
    property: "scale",
    dur: 300,
    from: { x: startingScale, y: startingScale, z: startingScale },
    to: { x: desiredScale, y: desiredScale, z: desiredScale },
    easing: "easeOutElastic"
  });
  menuEl.object3D.matrixNeedsUpdate = true;
}

const getBoundingSphereInfo = (function() {
  const AABB = new THREE.Box3();
  const center = new THREE.Vector3();
  const v = new THREE.Vector3();
  const sphere = new THREE.Sphere();
  const meshPosition = new THREE.Vector3();
  const meshRotation = new THREE.Matrix4();
  const meshRotationInverse = new THREE.Matrix4();
  const meshQuaternion = new THREE.Quaternion();
  const meshScale = new THREE.Vector3();
  const meshPositionToCenter = new THREE.Vector3();
  const localMeshToCenterDir = new THREE.Vector3();
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
    localMeshToCenterDir
      .copy(meshPositionToCenter)
      .normalize()
      .applyMatrix4(meshRotationInverse.getInverse(meshRotation));

    if (!isAlmostUniformVector3(meshScale, 0.005)) {
      console.warn(
        "Non-uniform scale detected unexpectedly on an object3D. Menu placement may fail!\n",
        v3String(meshScale),
        mesh,
        datum.rootEl
      );
      //TODO: As far as I can tell, we control the scale of these nodes,
      // and always expect them to be uniform. Supporting non-uniform scale
      // is not particularly difficult, but requires a new code path
      // without the same performance optimizations.
    }
    const meshScaleX = meshScale.x;
    datum.localMeshToCenterDir.copy(localMeshToCenterDir);
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
  const cameraPosition = new THREE.Vector3();
  const centerToCamera = new THREE.Vector3();
  const centerToCameraXZ = new THREE.Vector3();
  const centerToBoundingCylinder = new THREE.Vector3();
  return function calculateBoundaryPlacementInfo(infoIn, infoOut) {
    // Calculate the center of the bounding sphere
    const mesh = infoIn.mesh;
    mesh.updateMatrices();
    mesh.matrixWorld.decompose(meshPosition, meshQuaternion, meshScale);
    meshRotation.extractRotation(mesh.matrixWorld);
    meshToCenter
      .copy(infoIn.localMeshToCenterDir)
      .applyMatrix4(meshRotation)
      .multiplyScalar(meshScale.x * infoIn.distanceToCenterDividedByMeshScale);
    infoOut.centerOfBoundingSphere.addVectors(meshPosition, meshToCenter);

    // Calculate a position on the edge of the bounding cylinder, in the XZ-direction of the camera.
    const camera = infoIn.camera;
    camera.updateMatrices();
    cameraPosition.setFromMatrixPosition(camera.matrixWorld);
    centerToCamera.subVectors(cameraPosition, infoOut.centerOfBoundingSphere);
    centerToCameraXZ
      .copy(centerToCamera)
      .projectOnPlane(UP)
      .normalize();
    infoOut.positionAtBoundingCylinder.addVectors(
      infoOut.centerOfBoundingSphere,
      centerToBoundingCylinder.copy(centerToCameraXZ).multiplyScalar(meshScale.x * infoIn.radiusDividedByMeshScale)
    );
    infoOut.menuForwardDir.copy(centerToCameraXZ).multiplyScalar(-1);
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

const setRotationMatrixFromUpAndForward = (function() {
  const right = new THREE.Vector3();
  const backward = new THREE.Vector3();
  return function setRotationMatrixFromUpAndForward(up, forward, rotationMatrix) {
    // Assume up and forward are orthonormal vectors
    return rotationMatrix.makeBasis(right.crossVectors(forward, up), up, backward.copy(forward).multiplyScalar(-1));
  };
})();

let doConvexSweepTest;
const createFunctionForConvexSweepTest = function() {
  const bodyHelperSetAttributeData = { collisionFilterGroup: 0, collisionFilterMask: 0 };
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
    const menuBtBoxShape = new Ammo.btBoxShape(menuBtHalfExtents); // TODO: Do not recreate this every time
    menuBtFromTransform.setIdentity();
    menuBtFromTransform
      .getOrigin()
      .setValue(
        info.positionAtBoundingCylinder.x,
        info.positionAtBoundingCylinder.y,
        info.positionAtBoundingCylinder.z
      );
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
    bodyHelperSetAttributeData.collisionFilterGroup = SWEEP_TEST_LAYER;
    bodyHelperSetAttributeData.collisionFilterMask = SWEEP_TEST_LAYER;
    info.rootEl.setAttribute("body-helper", bodyHelperSetAttributeData);
    const menuBtClosestConvexResultCallback = new Ammo.ClosestConvexResultCallback(
      menuBtFromTransform.getOrigin(),
      menuBtToTransform.getOrigin()
    ); // TODO: Do not recreate this every time
    menuBtClosestConvexResultCallback.set_m_collisionFilterGroup(SWEEP_TEST_LAYER);
    menuBtClosestConvexResultCallback.set_m_collisionFilterMask(SWEEP_TEST_LAYER);
    btCollisionWorld.convexSweepTest(
      menuBtBoxShape,
      menuBtFromTransform,
      menuBtToTransform,
      menuBtClosestConvexResultCallback,
      0.01
    );
    bodyHelperSetAttributeData.collisionFilterGroup = group;
    bodyHelperSetAttributeData.collisionFilterMask = mask;
    info.rootEl.setAttribute("body-helper", bodyHelperSetAttributeData);
    const closestHitFraction = menuBtClosestConvexResultCallback.get_m_closestHitFraction();
    const fractionToUse = closestHitFraction === 1 ? 0 : closestHitFraction - FRACTION_FUDGE_FACTOR; // If the fraction is 1, then we didn't collide at all. In that case, choose a number near 0 (or 0 itself) to place it at the edge of the bounding sphere.
    return fractionToUse;
  };
};

const recomputeMenuPlacement = (function() {
  const menuWorldScale = new THREE.Vector3();
  const desiredMenuPosition = new THREE.Vector3();
  const desiredMenuRotation = new THREE.Matrix4();
  const desiredMenuQuaternion = new THREE.Quaternion();
  const menuTransformAtCylinderBorder = new THREE.Matrix4();
  const boundaryInfoIn = {
    camera: null,
    mesh: null,
    localMeshToCenterDir: new THREE.Vector3(),
    distanceToCenterDividedByMeshScale: 0,
    radiusDividedByMeshScale: 0
  };
  const boundaryInfoOut = {
    centerOfBoundingSphere: new THREE.Vector3(),
    positionAtBoundingCylinder: new THREE.Vector3(),
    menuForwardDir: new THREE.Vector3()
  };
  const convexSweepInfo = {
    menuMaxRight: 0,
    menuMinRight: 0,
    menuMaxUp: 0,
    menuMinUp: 0,
    positionAtBoundingCylinder: new THREE.Vector3(),
    menuWorldScale: new THREE.Vector3(),
    centerOfBoundingSphere: new THREE.Vector3(),
    desiredMenuQuaternion: new THREE.Quaternion(),
    rootEl: null
  };
  const desiredMenuTransform = new THREE.Matrix4();

  return function recomputeMenuPlacement(datum, camera, btCollisionWorld) {
    boundaryInfoIn.camera = camera;
    boundaryInfoIn.mesh = datum.rootMesh;
    boundaryInfoIn.localMeshToCenterDir.copy(datum.localMeshToCenterDir);
    boundaryInfoIn.distanceToCenterDividedByMeshScale = datum.distanceToCenterDividedByMeshScale;
    boundaryInfoIn.radiusDividedByMeshScale = datum.radiusDividedByMeshScale;
    calculateBoundaryPlacementInfo(boundaryInfoIn, boundaryInfoOut);
    setRotationMatrixFromUpAndForward(UP, boundaryInfoOut.menuForwardDir, desiredMenuRotation);
    desiredMenuQuaternion.setFromRotationMatrix(desiredMenuRotation);
    const shouldRecomputeMenuShapeInfo = !datum.didComputeMenuShapeInfoAtLeastOnce;
    if (shouldRecomputeMenuShapeInfo) {
      recomputeMenuShapeInfo(datum, boundaryInfoOut.positionAtBoundingCylinder, desiredMenuQuaternion);
    }
    datum.menuEl.object3D.updateMatrices();
    menuWorldScale.setFromMatrixScale(datum.menuEl.object3D.matrixWorld);
    setMatrixWorld(
      datum.menuEl.object3D,
      menuTransformAtCylinderBorder.compose(
        boundaryInfoOut.positionAtBoundingCylinder,
        desiredMenuQuaternion,
        menuWorldScale
      )
    );

    convexSweepInfo.menuMaxRight = datum.menuMaxRight;
    convexSweepInfo.menuMinRight = datum.menuMinRight;
    convexSweepInfo.menuMaxUp = datum.menuMaxUp;
    convexSweepInfo.menuMinUp = datum.menuMinUp;
    convexSweepInfo.positionAtBoundingCylinder.copy(boundaryInfoOut.positionAtBoundingCylinder);
    convexSweepInfo.menuWorldScale.copy(menuWorldScale);
    convexSweepInfo.centerOfBoundingSphere.copy(boundaryInfoOut.centerOfBoundingSphere);
    convexSweepInfo.desiredMenuQuaternion.copy(desiredMenuQuaternion);
    convexSweepInfo.rootEl = datum.rootEl;
    const hitFraction = doConvexSweepTest(convexSweepInfo, btCollisionWorld);
    desiredMenuPosition.lerpVectors(
      boundaryInfoOut.positionAtBoundingCylinder,
      boundaryInfoOut.centerOfBoundingSphere,
      hitFraction
    );
    desiredMenuTransform.compose(
      desiredMenuPosition,
      desiredMenuQuaternion,
      menuWorldScale
    );
    setMatrixWorld(datum.menuEl.object3D, desiredMenuTransform);
  };
})();

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
      menuEl.addEventListener("animationcomplete", () => {
        menuEl.removeAttribute("animation__show");
      });

      menuEl.object3D.scale.setScalar(0.01); // To avoid "pop" of gigantic button first time, since the animation won't take effect until the next frame
      menuEl.object3D.matrixNeedsUpdate = true;
      this.data.push({
        rootEl,
        rootMesh: null,
        previousRootMesh: null,
        previousRootObjectScale: new THREE.Vector3().setFromMatrixScale(rootEl.object3D.matrixWorld),
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
    const currentRootObjectScale = new THREE.Vector3();
    const menuPosition = new THREE.Vector3();
    const cameraPosition = new THREE.Vector3();
    const menuToCamera = new THREE.Vector3();
    return function tickDatum(datum) {
      datum.rootMesh = datum.rootEl.getObject3D("mesh");
      if (!datum.rootMesh) {
        return;
      }
      datum.rootEl.object3D.updateMatrices();
      const isMenuVisible = datum.menuEl.object3D.visible;
      const rootMeshChanged = datum.previousRootMesh !== datum.rootMesh;
      const shouldGetBoundingSphereInfo =
        isMenuVisible && (!datum.didGetBoundingSphereInfoAtLeastOnce || rootMeshChanged);
      if (shouldGetBoundingSphereInfo) {
        getBoundingSphereInfo(datum);
      }
      const shouldRecomputeMenuPlacement = isMenuVisible;
      if (shouldRecomputeMenuPlacement) {
        recomputeMenuPlacement(datum, this.viewingCamera, this.btCollisionWorld);
      }
      const isMenuOpening = isMenuVisible && !datum.wasMenuVisible;
      currentRootObjectScale.setFromMatrixScale(datum.rootEl.object3D.matrixWorld);
      const rootObjectScaleChanged = !almostEqualVector3(datum.previousRootObjectScale, currentRootObjectScale);
      const menuIsAnimating = datum.menuEl.getAttribute("animation__show");
      const shouldRestartMenuAnimation = isMenuOpening || (rootObjectScaleChanged && menuIsAnimating);
      if (shouldRestartMenuAnimation) {
        const distanceToMenu = menuToCamera
          .subVectors(
            menuPosition.setFromMatrixPosition(datum.menuEl.object3D.matrixWorld),
            cameraPosition.setFromMatrixPosition(this.viewingCamera.matrixWorld)
          )
          .length();
        const desiredScale = (0.5 * distanceToMenu) / currentRootObjectScale.x;
        restartMenuAnimation(datum.menuEl, menuIsAnimating, desiredScale);
      }
      datum.previousRootMesh = datum.rootMesh;
      datum.wasMenuVisible = isMenuVisible;
      datum.previousRootObjectScale.copy(currentRootObjectScale);
    };
  })();
  tick() {
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
    this.btCollisionWorld = this.btCollisionWorld || this.physicsSystem.world.physicsWorld;
    for (let i = 0; i < this.data.length; i++) {
      this.tickDatum(this.data[i]);
    }
  }
}
