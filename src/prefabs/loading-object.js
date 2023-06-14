/* eslint-disable react/no-unknown-property */
/** @jsx createElementEntity */
import { BoxGeometry, Mesh, MeshBasicMaterial } from "three";
import { createElementEntity } from "../utils/jsx-entity";
import { loadModel } from "../components/gltf-model-plus";
import loadingObjectSrc from "../assets/models/LoadingObject_Atom.glb";
import { cloneObject3D, disposeNode } from "../utils/three-utils";

// TODO We should have an explicit "preload assets" step
let loadingObject = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
loadModel(loadingObjectSrc, null, true).then(gltf => {
  disposeNode(loadingObject);
  loadingObject = gltf.scene;
});

// TODO: Do we really need to clone the loadingObject every time?
//       Should we use a pool?
export function LoadingObject() {
  return <entity name="Loading Object" object3D={cloneObject3D(loadingObject)} mixerAnimatable loopAnimation={[]} />;
}
