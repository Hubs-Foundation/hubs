import { addComponent, defineQuery, enterQuery } from "bitecs";
import { HubsWorld } from "../app";
import { Holdable, MediaContentBounds, Networked, Rigidbody } from "../bit-components";
import { getBox } from "../utils/auto-box-collider";
import { Mesh, Vector3 } from "three";
import { takeSoftOwnership } from "../utils/take-soft-ownership";
import { EntityID } from "../utils/networking-types";
import { COLLISION_LAYERS } from "../constants";

const tmpVector = new Vector3();

const interactableQuery = defineQuery([Holdable, Rigidbody, Networked]);
const interactableEnterQuery = enterQuery(interactableQuery);
export function interactableSystem(world: HubsWorld) {
  interactableEnterQuery(world).forEach((eid: EntityID) => {
    // Somebody must own a scene grabbable otherwise the networked transform will fight with physics.
    if (Networked.creator[eid] === APP.getSid("scene") && Networked.owner[eid] === APP.getSid("reticulum")) {
      takeSoftOwnership(world, eid);
    }

    const obj = world.eid2obj.get(eid);
    let hasMesh = false;
    obj?.traverse(child => {
      if ((child as Mesh).isMesh) {
        hasMesh = true;
      }
    });

    // If it has media frame collision mask, it needs to have content bounds
    if (hasMesh && Rigidbody.collisionFilterMask[eid] & COLLISION_LAYERS.MEDIA_FRAMES) {
      const box = getBox(obj, obj);
      if (!box.isEmpty()) {
        box.getSize(tmpVector);
        addComponent(world, MediaContentBounds, eid);
        MediaContentBounds.bounds[eid].set(tmpVector.toArray());
      } else {
        console.error(`Couldn't create content bounds for entity ${eid}. It seems to be empty or have negative scale.`);
      }
    }
  });
}
