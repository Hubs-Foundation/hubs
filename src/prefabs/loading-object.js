/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { loadModel } from "../components/gltf-model-plus";
import loadingObjectSrc from "../assets/models/LoadingObject_Atom.glb";

// Pre load and upload loading object, and intentionally never "release" it from the cache.
// TODO we should do this in a more explicit spot for "preloading" during the loading screen
let loadingObject = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
loadModel(loadingObjectSrc, null, true).then(gltf => {
  loadingObject = gltf.scene;
});

export function LoadingObject() {
  return <entity name="Loading Object" object3D={loadingObject.clone()} />;
}
