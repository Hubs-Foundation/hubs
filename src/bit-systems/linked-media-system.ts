import { addComponent, defineQuery, enterQuery, entityExists, exitQuery, hasComponent, removeComponent } from "bitecs";
import { HubsWorld } from "../app";
import { MirroredMedia, MediaMirrored, MediaLoaded, LinkedMedia } from "../bit-components";
import { cloneObject } from "./linked-menu-system";
import { deleteTheDeletableAncestor } from "./delete-entity-system";
import { anyEntityWith, findChildWithComponent } from "../utils/bit-utils";
import { EntityID } from "../utils/networking-types";

export function linkMedia(world: HubsWorld, eid: EntityID, sourceMediaEid: EntityID) {
  addComponent(world, LinkedMedia, eid);
  LinkedMedia.linkedRef[eid] = sourceMediaEid;
  addComponent(world, LinkedMedia, sourceMediaEid);
  LinkedMedia.linkedRef[sourceMediaEid] = eid;
}

export function removeMirroredMedia(world: HubsWorld) {
  const mirroredMediaEid = anyEntityWith(world, MirroredMedia);
  if (mirroredMediaEid) {
    deleteTheDeletableAncestor(world, mirroredMediaEid);
  }
}

const mediaMirroredQuery = defineQuery([MediaMirrored]);
const mediaMirroredEnterQuery = enterQuery(mediaMirroredQuery);
const mediaMirroredExitQuery = exitQuery(mediaMirroredQuery);
const mirroredMediaQuery = defineQuery([MirroredMedia]);
const mirroredMediaEnterQuery = enterQuery(mirroredMediaQuery);
const mirroredMediaExitQuery = exitQuery(mirroredMediaQuery);
export function linkedMediaSystem(world: HubsWorld) {
  mirroredMediaExitQuery(world).forEach(eid => {
    const mediaMirroredEid = MirroredMedia.linkedRef[eid];
    if (entityExists(world, mediaMirroredEid)) {
      const sourceMediaEid = findChildWithComponent(world, MediaLoaded, mediaMirroredEid)!;
      if (hasComponent(world, LinkedMedia, sourceMediaEid)) {
        removeComponent(world, LinkedMedia, sourceMediaEid);
      }
      removeComponent(world, MediaMirrored, mediaMirroredEid);
    }
  });
  mirroredMediaEnterQuery(world).forEach(eid => {
    const sourceMediaEid = MirroredMedia.linkedRef[eid];
    MediaMirrored.linkedRef[sourceMediaEid] = eid;
  });
  mediaMirroredExitQuery(world).forEach(eid => removeMirroredMedia(world));
  mediaMirroredEnterQuery(world).forEach(eid => {
    const clonedEid = cloneObject(world, eid);
    const clonedObj = world.eid2obj.get(clonedEid)!;
    clonedObj.scale.set(0.75, 0.75, 0.75);
    clonedObj.matrixNeedsUpdate = true;

    addComponent(world, MirroredMedia, clonedEid);
    MirroredMedia.linkedRef[clonedEid] = eid;
  });
}
