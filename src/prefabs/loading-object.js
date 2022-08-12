/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { loadModel } from "../components/gltf-model-plus";
import loadingObjectSrc from "../assets/models/LoadingObject_Atom.glb";
import { disposeNode } from "../utils/three-utils";

// TODO We should have an explicit "preload assets" step
let loadingObject = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
loadModel(loadingObjectSrc, null, true).then(gltf => {
  disposeNode(loadingObject);
  loadingObject = gltf.scene;
});

export function LoadingObject() {
  return <entity name="Loading Object" object3D={loadingObject.clone()} />;
}
