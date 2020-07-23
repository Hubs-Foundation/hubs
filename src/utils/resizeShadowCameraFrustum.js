const boundingBox = new THREE.Box3();
const frustumBox = new THREE.Box3();
const inverseLightMatrixWorld = new THREE.Matrix4();
const tempBox = new THREE.Box3();
const FRUSTUM_PADDING = 1;
const NEAR_CLIPPING_PLANE = 0;
const FAR_CLIPPING_PLANE = 0;
const verts = [
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3()
];

export default function resizeShadowCameraFrustum(light, scene) {
  const box = new THREE.Box3();
  const center = new THREE.Vector3();
  const delta = new THREE.Vector3();
  const sphere = new THREE.Sphere();

  let distance = 0;

  box.makeEmpty();

  scene.traverse(object => {
    const geometry = object.geometry;

    if (geometry && object.castShadow) {
      if (!geometry.boundingBox) {
        geometry.computeBoundingBox();
      }

      box.union(geometry.boundingBox);
    }
  });

  if (box.isEmpty() === false) {
    box.getCenter(center);
    distance = box.getBoundingSphere(sphere).radius;
  } else {
    distance = 100;
  }

  delta.set(0, 0, -1);
  delta.applyQuaternion(light.parent.quaternion);
  delta.multiplyScalar(100);

  light.parent.position.copy(center).add(delta);
  light.parent.matrixNeedsUpdate = true;
  light.matrixNeedsUpdate = true;
  light.shadow.camera.matrixNeedsUpdate = true;
  light.shadow.camera.left = -100;
  light.shadow.camera.right = 100;
  light.shadow.camera.top = 100;
  light.shadow.camera.bottom = -100;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 500;
  light.shadow.camera.updateProjectionMatrix();
  console.log(light.parent);
}
