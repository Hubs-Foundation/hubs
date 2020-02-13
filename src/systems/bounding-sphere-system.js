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
  const temporaryTransform = new THREE.Matrix4();
  const meshScale = new THREE.Vector3();
  const meshRotation = new THREE.Matrix4();
  const meshRotationInverse = new THREE.Matrix4();
  const meshPositionToCenter = new THREE.Vector3();
  return function computeBoundingSphereInfo(mesh) {
    mesh.updateMatrices();
    mesh.matrixWorld.decompose(meshPosition, meshQuaternion, meshScale);
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

    return {
      localMeshToCenterDir: new THREE.Vector3()
        .copy(meshPositionToCenter)
        .applyMatrix4(meshRotationInverse.getInverse(meshRotation))
        .normalize(),
      distanceToCenterDividedByMeshScale: distanceToCenter / meshScale.x,
      radiusDividedByMeshScale: radius / meshScale.x
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
