import { computeObjectAABB } from "../utils/auto-box-collider";
import { setMatrixWorld, isAlmostUniformVector3 } from "../utils/three-utils";
import { v3String } from "../utils/pretty-print";

const computeBoundingSphereInfo = (function() {
  const AABB = new THREE.Box3();
  const center = new THREE.Vector3();
  const v = new THREE.Vector3();
  const sphere = new THREE.Sphere();
  const meshPosition = new THREE.Vector3();
  const meshQuaternion = new THREE.Quaternion();
  const ONES = new THREE.Vector3().set(1, 1, 1);
  const temporaryTransform = new THREE.Matrix4();
  const meshScale = new THREE.Vector3();
  const meshRotation = new THREE.Matrix4();
  const meshRotationInverse = new THREE.Matrix4();
  const meshPositionToCenter = new THREE.Vector3();
  return function computeBoundingSphereInfo(mesh) {
    mesh.updateMatrices();
    mesh.matrixWorld.decompose(meshPosition, meshQuaternion, meshScale);
    ONES.set(1, 1, 1);
    setMatrixWorld(mesh, temporaryTransform.compose(meshPosition, meshQuaternion, ONES)); // Objects sometimes start with extremely small scale, so we temporarily set it to ONES to avoid computational issues
    computeObjectAABB(mesh, AABB);
    center.addVectors(AABB.min, AABB.max).multiplyScalar(0.5);
    const radius = v.subVectors(AABB.max, AABB.min).length() / 2;
    sphere.set(center, radius);
    if (!isAlmostUniformVector3(meshScale, 0.005)) {
      console.warn(
        "Non-uniform scale detected unexpectedly on an object3D. Menu placement may fail!\n",
        v3String(meshScale),
        mesh
      );
      //TODO: As far as I can tell, we control the scale of these nodes, and
      // always expect them to be uniform. Supporting non-uniform scale requires
      // a different code path without the same performance optimizations.
    }
    meshRotation.extractRotation(mesh.matrixWorld);
    meshPositionToCenter.subVectors(center, meshPosition);
    const distanceToCenter = meshPositionToCenter.length();

    setMatrixWorld(mesh, temporaryTransform.compose(meshPosition, meshQuaternion, meshScale));

    return {
      localMeshToCenterDir: new THREE.Vector3()
        .copy(meshPositionToCenter)
        .applyMatrix4(meshRotationInverse.getInverse(meshRotation))
        .normalize(),
      distanceToCenterDividedByMeshScale: distanceToCenter,
      radiusDividedByMeshScale: radius
    };
  };
})();

export class BoundingSphereSystem {
  constructor() {
    this.els = [];
    this.data = new Map();
  }
  register(el) {
    this.els.push(el);
    this.data.set(el, { mesh: null, boundingSphereInfo: null });
  }
  unregister(el) {
    this.els.splice(this.els.indexOf(el), 1);
    this.data.delete(el);
  }
  tick() {
    for (let i = 0; i < this.els.length; i++) {
      const el = this.els[i];
      const mesh = el.getObject3D("mesh");
      if (!mesh) continue;
      const datum = this.data.get(el);
      const isMeshChanged = datum.mesh !== mesh;
      datum.mesh = mesh;
      const shouldComputeBoundingSphereInfo = !datum.boundingSphereInfo || isMeshChanged;
      if (shouldComputeBoundingSphereInfo) {
        datum.boundingSphereInfo = computeBoundingSphereInfo(mesh);
      }
    }
  }
}

export class BoundingSphereVisualizationSystem {
  constructor(scene, boundingSphereSystem) {
    this.boundingSphereSystem = boundingSphereSystem;
    this.els = [];
    this.data = new Map();
    this.scene = scene;
    this.wasEnabled = false;
    this.enabled = false;
    this.tick = this.tick.bind(this);
  }
  tick = (function() {
    const meshPosition = new THREE.Vector3();
    const meshQuaternion = new THREE.Quaternion();
    const meshRotation = new THREE.Matrix4();
    const meshScale = new THREE.Vector3();
    const meshToCenter = new THREE.Vector3();
    const centerOfBoundingSphere = new THREE.Vector3();
    return function tick() {
      // Wait one frame before disabling so that we have a chance to turn spheres invisible!
      if (!this.enabled && !this.wasEnabled) return;
      this.wasEnabled = this.enabled;

      // Add any els we are missing
      for (let i = 0, len = this.boundingSphereSystem.els.length; i < len; i++) {
        const el = this.boundingSphereSystem.els[i];
        if (!this.data.get(el)) {
          this.els.push(el);
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 8, 8, 0, 2 * Math.PI, 0, Math.PI),
            new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.FrontSide, transparent: true, opacity: 0.2 })
          );
          this.scene.object3D.add(sphere);
          this.data.set(el, { sphere });
        }
      }

      // Remove any els that have gone away
      let index = 0;
      while (index < this.els.length) {
        const el = this.els[index];
        if (!this.boundingSphereSystem.data.get(el)) {
          this.els.splice(this.els.indexOf(el), 1);
          const datum = this.data.get(el);
          datum.sphere.parent.remove(datum.sphere);
          this.data.delete(el);
        } else {
          index = index + 1;
        }
      }

      // Update visualization
      for (let i = 0, len = this.els.length; i < len; i++) {
        const el = this.els[i];
        const datum = this.boundingSphereSystem.data.get(el);
        const sphere = this.data.get(el).sphere;
        const mesh = datum.mesh;
        if (!mesh) continue;
        const boundingSphereInfo = datum.boundingSphereInfo;

        mesh.updateMatrices();
        mesh.matrixWorld.decompose(meshPosition, meshQuaternion, meshScale);
        meshRotation.extractRotation(mesh.matrixWorld);
        meshToCenter
          .copy(boundingSphereInfo.localMeshToCenterDir)
          .applyMatrix4(meshRotation)
          .multiplyScalar(meshScale.x * boundingSphereInfo.distanceToCenterDividedByMeshScale);
        centerOfBoundingSphere.addVectors(meshPosition, meshToCenter);
        sphere.position.copy(centerOfBoundingSphere);
        sphere.scale.setScalar(boundingSphereInfo.radiusDividedByMeshScale * meshScale.x);
        sphere.matrixNeedsUpdate = true;
        sphere.visible = this.enabled;
      }
    };
  })();
  tick() {}
}
