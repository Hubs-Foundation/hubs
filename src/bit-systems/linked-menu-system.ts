import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import type { HubsWorld } from "../app";
import { Interacted, MirrorMenu, FollowInFov, MirroredMedia } from "../bit-components";
import { anyEntityWith } from "../utils/bit-utils";
import type { EntityID } from "../utils/networking-types";
import { createMessageDatas } from "./networking";
import { renderAsEntity } from "../utils/jsx-entity";
import { LinkedMediaPrefab } from "../prefabs/linked-media";
import { removeMirroredMedia } from "./linked-media-system";

export function cloneObject(world: HubsWorld, sourceEid: EntityID): EntityID {
  const { initialData } = createMessageDatas.get(sourceEid)!;
  initialData.isObjectMenuTarget = false;
  const clonedEid = renderAsEntity(world, LinkedMediaPrefab(initialData));
  return clonedEid;
}
export const enum MirrorMenuFlags {
  Visible = 1 << 0
}

function clicked(world: HubsWorld, eid: EntityID) {
  return hasComponent(world, Interacted, eid);
}

function handleClicks(world: HubsWorld, menu: EntityID) {
  if (clicked(world, MirrorMenu.closeRef[menu])) {
    MirrorMenu.flags[menu] &= ~MirrorMenuFlags.Visible;
    removeMirroredMedia(world);
  }
}

function updateVisibility(world: HubsWorld, menu: EntityID) {
  const obj = world.eid2obj.get(menu)!;
  obj.visible = Boolean(MirrorMenu.flags[menu] & MirrorMenuFlags.Visible);
}

const mirroredMediaQuery = defineQuery([MirroredMedia]);
const mirroredMediaEnterQuery = enterQuery(mirroredMediaQuery);
const mirroredMediaExitQuery = exitQuery(mirroredMediaQuery);
export function linkedMenuSystem(world: HubsWorld) {
  const menu = anyEntityWith(world, MirrorMenu)!;

  if (MirrorMenu.flags[menu] & MirrorMenuFlags.Visible) {
    handleClicks(world, menu);
  }

  mirroredMediaExitQuery(world).forEach(eid => {
    MirrorMenu.flags[menu] &= ~MirrorMenuFlags.Visible;
  });

  mirroredMediaEnterQuery(world).forEach(eid => {
    FollowInFov.started[menu] = 0;

    const mirrorTargetEid = MirrorMenu.mirrorTargetRef[menu];
    const mirrorTargetObj = world.eid2obj.get(mirrorTargetEid);
    const mirroredObj = world.eid2obj.get(eid)!;
    mirrorTargetObj?.add(mirroredObj);

    MirrorMenu.flags[menu] |= MirrorMenuFlags.Visible;
  });

  updateVisibility(world, menu);
}
