const boundingBox = new THREE.Box3();
const frustumBox = new THREE.Box3();
const inverseLightMatrixWorld = new THREE.Matrix4();
const tempBox = new THREE.Box3();
const FRUSTUM_PADDING = 1;
const NEAR_CLIPPING_PLANE = -500;
const FAR_CLIPPING_PLANE = 500;
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
  // Reset bounding box
  frustumBox.makeEmpty();
  boundingBox.makeEmpty();

  // Grow the extents of boundingBox for every geometry in the scene that has castShadow set to true.
  scene.traverse(node => {
    const geometry = node.geometry;

    if (geometry && node.castShadow) {
      if (!geometry.boundingBox) {
        geometry.computeBoundingBox();
      }

      tempBox.copy(geometry.boundingBox);

      // Apply matrix transforming bounding box from model space to world space
      tempBox.applyMatrix4(node.matrixWorld);

      boundingBox.union(tempBox);
    }
  });

  // Transform the resulting bounding box from world space to light space.
  // Construct a new bounding box in light space that contains the corners of the bounding box in world space.
  const min = boundingBox.min;
  const max = boundingBox.max;

  verts[0].set(min.x, min.y, min.z);
  verts[1].set(min.x, min.y, max.z);
  verts[2].set(min.x, max.y, min.z);
  verts[3].set(min.x, max.y, max.z);
  verts[4].set(max.x, min.y, min.z);
  verts[5].set(max.x, min.y, max.z);
  verts[6].set(max.x, max.y, min.z);
  verts[7].set(max.x, max.y, max.z);

  inverseLightMatrixWorld.getInverse(light.shadow.camera.matrixWorld);

  for (let i = 0; i < verts.length; i++) {
    verts[i].applyMatrix4(inverseLightMatrixWorld);
    frustumBox.expandByPoint(verts[i]);
  }

  // Update the camera frustum to fit the resulting bounding box.
  // Everything in the frustum that has castShadow set to true will cast a shadow.
  // Everything in the frustum that has receiveShadow set to true will receive a shadow.
  // FRUSTUM_PADDING is added to avoid clipping the edges of shadows.
  // TODO: Determine why shadows flicker when light is moved fast. The light's matrixWorld is probably being updated a frame behind.
  const camera = light.shadow.camera;
  camera.left = frustumBox.min.x - FRUSTUM_PADDING;
  camera.right = frustumBox.max.x + FRUSTUM_PADDING;
  camera.bottom = frustumBox.min.y - FRUSTUM_PADDING;
  camera.top = frustumBox.max.y + FRUSTUM_PADDING;
  camera.near = frustumBox.min.z + NEAR_CLIPPING_PLANE;
  camera.far = frustumBox.max.z + FAR_CLIPPING_PLANE;
  camera.updateProjectionMatrix();
}
