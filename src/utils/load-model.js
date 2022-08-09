import { addComponent, addEntity, hasComponent } from "bitecs";
import { GLTFModel, Networked } from "../bit-components";
// TODO Fix function names
import { loadModel as loadGLTFModel } from "../components/gltf-model-plus";
import { addObject3DComponent, inflators } from "../utils/jsx-entity";
import { findAncestor } from "./three-utils";
// import { sleep } from "../utils/async-utils";

export function* loadModel({ world, mediaLoaderEid, accessibleUrl }) {
  const { scene, animations } = yield loadGLTFModel(accessibleUrl, null, true, null, false);
  scene.userData.gltfSrc = accessibleUrl;
  scene.animations = animations;
  scene.mixer = new THREE.AnimationMixer(scene);

  const swap = [];
  scene.traverse(obj => {
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

    // Re-use the the uuid for animation targeting.
    // TODO: This is weird... Should we be rewriting the animations instead?
    replacement.uuid = old.uuid;

    old.parent.add(replacement);
    old.removeFromParent();
  });

  const rootNid = APP.getString(Networked.id[mediaLoaderEid]);
  const rootCreator = Networked.creator[mediaLoaderEid];
  const rootOwner = Networked.owner[mediaLoaderEid];

  console.log({ mediaLoaderEid, rootNid, rootCreator, rootOwner });

  let i = 0;
  scene.traverse(function (obj) {
    if (obj.eid && hasComponent(world, Networked, obj.eid)) {
      const eid = obj.eid;
      Networked.id[eid] = APP.getSid(i === 0 ? rootNid : `${rootNid}.${i}`);
      APP.world.nid2eid.set(Networked.id[eid], eid);
      Networked.creator[eid] = rootCreator;
      Networked.owner[eid] = rootOwner;
      if (NAF.clientId === rootOwner) takeOwnership(world, eid);
      i += 1;
    }
  });

  addComponent(world, GLTFModel, scene.eid);
  return scene.eid;
}
