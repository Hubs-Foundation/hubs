export class BoundingSphereVisualizationSystem {
  constructor(scene, boundingSphereSystem) {
    this.scene = scene;
    this.boundingSphereSystem = boundingSphereSystem;
    this.tick = this.tick.bind(this);
    this.els = [];
    this.spheres = new Map();
    this.enabled = false;
    this.wasEnabled = false;
  }
  register(el) {
    this.els.push(el);
  }
  unregister(el) {
    this.els.splice(this.els.indexOf(el), 1);
    const sphere = this.spheres.get(el);
    if (sphere) {
      sphere.parent.remove(sphere);
      this.spheres.delete(el);
    }
  }
  tick = (function() {
    const meshPosition = new THREE.Vector3();
    const meshQuaternion = new THREE.Quaternion();
    const meshRotation = new THREE.Matrix4();
    const meshScale = new THREE.Vector3();
    const meshToCenter = new THREE.Vector3();
    const centerOfBoundingSphere = new THREE.Vector3();
    return function tick() {
      if (!this.enabled && !this.wasEnabled) return;
      this.wasEnabled = this.enabled;

      for (let i = 0, len = this.els.length; i < len; i++) {
        const el = this.els[i];
        const datum = this.boundingSphereSystem.data.get(el);
        const mesh = datum.mesh;
        if (!mesh) continue;
        let sphere = this.spheres.get(el);
        if (!sphere) {
          sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 8, 8, 0, 2 * Math.PI, 0, Math.PI),
            new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.BackSide, transparent: true, opacity: 0.2 })
          );
          sphere.visible = false;
          this.scene.object3D.add(sphere);
          this.spheres.set(el, sphere);
        }
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
}
