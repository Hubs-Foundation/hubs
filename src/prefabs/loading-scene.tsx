/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { loadModel } from "../components/gltf-model-plus";
import loadingSceneSrc from "../assets/models/LoadingScene.glb";
import { disposeNode } from "../utils/three-utils";
import { registeredTextures, textureToData } from "../components/uv-scroll";

// TODO We should have an explicit "preload assets" step
export const loadingScene = new THREE.Object3D();
loadModel(loadingSceneSrc, null, true).then(gltf => {
  const mesh = gltf.scene.children[0];
  const map = mesh.material.map;
  textureToData.set(map, {
    offset: new THREE.Vector2(),
    instances: [{ component: { data: mesh.userData.gltfExtensions.MOZ_hubs_components["uv-scroll"] }, mesh }]
  });
  registeredTextures.push(map);
  loadingScene.add(gltf.scene);
});

export function LoadingScene() {
  return <entity name="Loading Scene" object3D={loadingScene} />;
}
