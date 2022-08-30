import { addComponent, addEntity } from "bitecs";
import { GLTFModel } from "../bit-components";
// TODO Fix function names
import { loadModel as loadGLTFModel } from "../components/gltf-model-plus";
import { addObject3DComponent, inflators } from "../utils/jsx-entity";

function camelCase(s) {
  return s.replace(/-(\w)/g, (_, m) => m.toUpperCase());
}

export function* loadModel(world, url) {
  const { scene, animations } = yield loadGLTFModel(url, null, true, null, false);
  scene.userData.gltfSrc = url;
  scene.animations = animations;
  scene.mixer = new THREE.AnimationMixer(scene);

  const swap = [];
  scene.traverse(obj => {
    const components = obj.userData?.gltfExtensions?.MOZ_hubs_components || {};
    const eid = addEntity(world);
    Object.keys(components).forEach(name => {
      const inflatorName = camelCase(name);
      if (!inflators[inflatorName]) {
        // TODO: Throw error or warn?
        // throw new Error(`Failed to inflate unknown component called ${name}`);
        console.warn(`Failed to inflate unknown component called ${inflatorName}`);
        return;
      }
      inflators[inflatorName](world, eid, components[name]);
    });
    const replacement = world.eid2obj.get(eid);
    if (replacement) {
      if (obj.type !== "Object3D") {
        throw new Error("Cannot replace node in scene graph; it is not an Object3D.");
      }
      swap.push([obj, replacement]);
    } else {
      addObject3DComponent(world, eid, obj);
    }
  });

  addComponent(world, GLTFModel, scene.eid);

  // Swap object3D's in the scene graph an inflator created replacement
  swap.forEach(([old, replacement]) => {
    for (let i = old.children.length - 1; i >= 0; i--) {
      replacement.add(old.children[i]);
    }
    replacement.position.copy(old.position);
    replacement.quaternion.copy(old.quaternion);
    replacement.scale.copy(old.scale);
    replacement.matrixNeedsUpdate = true;

    // Re-use the the uuid for animation targeting.
    // TODO: This is weird... Should we be rewriting the animations instead?
    replacement.uuid = old.uuid;

    old.parent.add(replacement);
    old.removeFromParent();
  });

  return scene.eid;
}
