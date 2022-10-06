import { addComponent, addEntity } from "bitecs";
import { Object3D } from "three";
import { HubsWorld } from "../app";
import { GLTFModel } from "../bit-components";
import { addObject3DComponent, inflators, inflatorExists } from "../utils/jsx-entity";

function camelCase(s: string) {
  return s.replace(/-(\w)/g, (_, m) => m.toUpperCase());
}

export type ModelParams = { model: Object3D };

export function inflateModel(world: HubsWorld, rootEid: number, { model }: ModelParams) {
  const swap: [old: Object3D, replacement: Object3D][] = [];
  model.traverse(obj => {
    // TODO: Which of these need "?"
    const components = obj.userData?.gltfExtensions?.MOZ_hubs_components || {};
    const eid = obj === model ? rootEid : addEntity(world);
    Object.keys(components).forEach(name => {
      const inflatorName = camelCase(name);
      if (!inflatorExists(inflatorName)) {
        console.warn(`Failed to inflate unknown component called ${inflatorName}`);
        return;
      }
      inflators[inflatorName](world, eid, components[name]);
    });
    const replacement = world.eid2obj.get(eid);
    if (replacement) {
      if (obj.type !== "Object3D") {
        console.error(obj, replacement);
        throw new Error("Failed to inflate model. Unexpected object type found before swap.");
      }
      if (obj === model) {
        throw new Error("Failed to inflate model. Can't inflate alternative object type on root scene.");
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

    old.parent!.add(replacement);
    old.removeFromParent();
  });

  addComponent(world, GLTFModel, rootEid);
  // TODO Animation Mixer
}
