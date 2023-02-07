import { defineQuery, entityExists, hasComponent } from "bitecs";
import type { HubsWorld } from "../app";
import { HoveredRemoteRight, Interacted, ObjectMenu, ObjectMenuTarget } from "../bit-components";
import { anyEntityWith, findAncestorWithComponent } from "../utils/bit-utils";
import { createEntityState, deleteEntityState } from "../utils/entity-state-utils";
import HubChannel from "../utils/hub-channel";
import type { EntityID } from "../utils/networking-types";
import { setMatrixWorld } from "../utils/three-utils";
import { deleteTheDeletableAncestor } from "./delete-entity-system";
import { isPinned } from "./networking";

function clicked(world: HubsWorld, eid: EntityID) {
  return hasComponent(world, Interacted, eid);
}

function objectMenuTarget(world: HubsWorld, menu: EntityID, sceneIsFrozen: boolean) {
  if (!sceneIsFrozen) {
    return 0;
  }

  const target = hoveredQuery(world).map(eid => findAncestorWithComponent(world, ObjectMenuTarget, eid))[0];
  if (target) return target;

  if (entityExists(world, ObjectMenu.targetRef[menu])) {
    return ObjectMenu.targetRef[menu];
  }

  return 0;
}

function moveToTarget(world: HubsWorld, menu: EntityID) {
  const targetObj = world.eid2obj.get(ObjectMenu.targetRef[menu])!;
  targetObj.updateMatrices();

  const menuObj = world.eid2obj.get(menu)!;

  // TODO: position the menu more carefully...
  setMatrixWorld(menuObj, targetObj.matrixWorld);
}

function handleClicks(world: HubsWorld, menu: EntityID, hubChannel: HubChannel) {
  if (clicked(world, ObjectMenu.pinButtonRef[menu])) {
    createEntityState(hubChannel, world, ObjectMenu.targetRef[menu]);
  } else if (clicked(world, ObjectMenu.unpinButtonRef[menu])) {
    deleteEntityState(hubChannel, world, ObjectMenu.targetRef[menu]);
  } else if (clicked(world, ObjectMenu.cameraFocusButtonRef[menu])) {
    console.log("Clicked focus");
  } else if (clicked(world, ObjectMenu.cameraTrackButtonRef[menu])) {
    console.log("Clicked track");
  } else if (clicked(world, ObjectMenu.removeButtonRef[menu])) {
    deleteTheDeletableAncestor(world, ObjectMenu.targetRef[menu]);
  } else if (clicked(world, ObjectMenu.dropButtonRef[menu])) {
    console.log("Clicked drop");
  } else if (clicked(world, ObjectMenu.inspectButtonRef[menu])) {
    console.log("Clicked inspect");
  } else if (clicked(world, ObjectMenu.deserializeDrawingButtonRef[menu])) {
    console.log("Clicked deserialize drawing");
  } else if (clicked(world, ObjectMenu.openLinkButtonRef[menu])) {
    console.log("Clicked open link");
  } else if (clicked(world, ObjectMenu.refreshButtonRef[menu])) {
    console.log("Clicked refresh");
  } else if (clicked(world, ObjectMenu.cloneButtonRef[menu])) {
    console.log("Clicked clone");
  } else if (clicked(world, ObjectMenu.rotateButtonRef[menu])) {
    console.log("Clicked rotate");
  } else if (clicked(world, ObjectMenu.mirrorButtonRef[menu])) {
    console.log("Clicked mirror");
  } else if (clicked(world, ObjectMenu.scaleButtonRef[menu])) {
    console.log("Clicked scale");
  }
}

function updateVisibility(world: HubsWorld, menu: EntityID, frozen: boolean) {
  const target = ObjectMenu.targetRef[menu];
  const visible = !!(target && frozen);

  const obj = world.eid2obj.get(menu)!;
  obj.visible = visible;

  world.eid2obj.get(ObjectMenu.pinButtonRef[menu])!.visible = visible && !isPinned(target);
  world.eid2obj.get(ObjectMenu.unpinButtonRef[menu])!.visible = visible && isPinned(target);

  [
    ObjectMenu.cameraFocusButtonRef[menu],
    ObjectMenu.cameraTrackButtonRef[menu],
    ObjectMenu.removeButtonRef[menu],
    ObjectMenu.dropButtonRef[menu],
    ObjectMenu.inspectButtonRef[menu],
    ObjectMenu.deserializeDrawingButtonRef[menu],
    ObjectMenu.openLinkButtonRef[menu],
    ObjectMenu.refreshButtonRef[menu],
    ObjectMenu.cloneButtonRef[menu],
    ObjectMenu.rotateButtonRef[menu],
    ObjectMenu.mirrorButtonRef[menu],
    ObjectMenu.scaleButtonRef[menu]
  ].forEach(buttonRef => {
    const buttonObj = world.eid2obj.get(buttonRef)!;
    // Parent visibility doesn't block raycasting, so we must set each button to be invisible
    // TODO: Ensure that children of invisible entities aren't raycastable
    buttonObj.visible = visible;
  });
}

const hoveredQuery = defineQuery([HoveredRemoteRight]);
export function objectMenuSystem(world: HubsWorld, sceneIsFrozen: boolean, hubChannel: HubChannel) {
  const menu = anyEntityWith(world, ObjectMenu)!;

  ObjectMenu.targetRef[menu] = objectMenuTarget(world, menu, sceneIsFrozen);
  if (ObjectMenu.targetRef[menu]) {
    moveToTarget(world, menu);
    handleClicks(world, menu, hubChannel);
  }
  updateVisibility(world, menu, sceneIsFrozen);
}
