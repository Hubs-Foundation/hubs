import { addComponent, addEntity } from "bitecs";
import { GLTFModel } from "../bit-components";
import { loadModel } from "../components/gltf-model-plus";
import { addObject3DComponent } from "../utils/jsx-entity";

export function inflateModel(world, eid, { src }) {
  const obj = new THREE.Group();
  addObject3DComponent(world, eid, obj);
  loadModel(src, null, true).then(gltf => {
    // TODO inflating components and create animation mixers
    const modelEid = addEntity(world);
    addObject3DComponent(world, modelEid, gltf.scene);
    addComponent(world, GLTFModel, modelEid);
    gltf.scene.userData.gltfSrc = src;
    obj.add(gltf.scene);
  });
}
