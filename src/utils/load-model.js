import { addComponent, addEntity } from "bitecs";
import { GLTFModel } from "../bit-components";
// TODO Fix function names
import { loadModel as loadGLTFModel } from "../components/gltf-model-plus";
import { addObject3DComponent, inflators } from "../utils/jsx-entity";

// import cubeSrc from "../assets/models/polite_cube.glb";
// console.warn("Cube src is", cubeSrc);

export function* loadModel({ world, accessibleUrl }) {
  const { scene, animations } = yield loadGLTFModel(accessibleUrl, null, true, null, false);
  scene.userData.gltfSrc = accessibleUrl;
  scene.animations = animations;
  scene.mixer = new THREE.AnimationMixer(scene);

  const swap = [];
  // Inflate components
  scene.traverse(obj => {
    // TODO: Which of these need "?"
    const components = obj.userData?.gltfExtensions?.MOZ_hubs_components || {};

    const eid = addEntity(world);

    Object.keys(components).forEach(name => {
      if (!inflators[name]) {
        // TODO: Throw error or warn?
        // throw new Error(`Failed to inflate unknown component called ${name}`);
        console.warn(`Failed to inflate unknown component called ${name}`);
        return;
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
