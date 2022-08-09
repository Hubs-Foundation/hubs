import { addComponent, addEntity } from "bitecs";
import { GLTFModel } from "../bit-components";
import { loadModel } from "../components/gltf-model-plus";
import { addObject3DComponent, inflators } from "../utils/jsx-entity";

export function inflateModel(world, rootEid, { src }) {
  const rootObj = new THREE.Group();
  addObject3DComponent(world, rootEid, rootObj);
  loadModel(src, null, true, null, false).then(gltf => {
    const swap = [];

    gltf.scene.traverse(obj => {
      // TODO: Which of these need "?"
      const components = obj.userData?.gltfExtensions?.MOZ_hubs_components || {};

      const eid = addEntity(world);

      Object.keys(components).forEach(name => {
        if (!inflators[name]) {
          throw new Error(`Failed to inflate unknown component called ${name}`);
        }

        inflators[name](world, eid, components[name]);
      });

      const replacement = world.eid2obj.get(eid);
      if (replacement) {
        if (obj.type !== "Object3D") {
          throw new Error("todo write error message here");
        }
        swap.push([obj, replacement]);
      } else {
        addObject3DComponent(world, eid, obj);
      }
    });

    swap.forEach(([old, replacement]) => {
      for (let i = old.children.length - 1; i >= 0; i--) {
        replacement.add(old.children[i]);
      }
      replacement.position.copy(old.position);
      replacement.quaternion.copy(old.quaternion);
      replacement.scale.copy(old.scale);
      replacement.matrixNeedsUpdate = true;

      old.parent.add(replacement);
      old.removeFromParent();
    });

    addComponent(world, GLTFModel, gltf.scene.eid);
    // TODO Animation Mixer
    gltf.scene.userData.gltfSrc = src;
    rootObj.add(gltf.scene);
  });
}
