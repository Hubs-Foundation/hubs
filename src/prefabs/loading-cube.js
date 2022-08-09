/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { loadModel } from "../components/gltf-model-plus";
import loadingObjectSrc from "../assets/models/LoadingObject_Atom.glb";

// Pre load and upload loading object, and intentionally never "release" it from the cache.
// TODO we should do this in a more explicit spot for "preloading" during the loading screen
loadModel(loadingObjectSrc, null, true);

export function LoadingCubePrefab({ ref }) {
  // TODO: Use loading object
  return (
    <entity
      name="Loading Cube"
      ref={ref}
      object3D={new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())}
    />
  );
}
