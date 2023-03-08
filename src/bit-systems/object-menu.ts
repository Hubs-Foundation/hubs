import { defineQuery, entityExists, hasComponent } from "bitecs";
import { Matrix4, Vector3 } from "three";
import type { HubsWorld } from "../app";
import { HoveredRemoteRight, Interacted, ObjectMenu, ObjectMenuTarget } from "../bit-components";
import { anyEntityWith, findAncestorWithComponent } from "../utils/bit-utils";
import { createNetworkedEntity } from "../utils/create-networked-entity";
import { createEntityState, deleteEntityState } from "../utils/entity-state-utils";
import HubChannel from "../utils/hub-channel";
import type { EntityID } from "../utils/networking-types";
import { setMatrixWorld } from "../utils/three-utils";
import { deleteTheDeletableAncestor } from "./delete-entity-system";
import { createMessageDatas, isPinned } from "./networking";

// Working variables.
const _vec1 = new Vector3();
const _vec2 = new Vector3();
const _mat4 = new Matrix4();

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

function openLink(world: HubsWorld, eid: EntityID) {
  const { initialData } = createMessageDatas.get(eid)!;
  const src = initialData.src;
  // TODO: Currently only accounts for the simple case of an external url
  //       but should support other type actions(eg: avatar update for avatar
  //       url, room switch for Hubs room url).
  //       See src/components/open-media-button.js
  window.open(src);
}

function cloneObject(world: HubsWorld, sourceEid: EntityID) {
  // Cloning by creating a networked entity from initial data.
  // Probably it would be easier than copying Component data and
  // Object3D.
  const { prefabName, initialData } = createMessageDatas.get(sourceEid)!;
  const clonedEid = createNetworkedEntity(world, prefabName, initialData);
  const clonedObj = world.eid2obj.get(clonedEid)!;

  // Place the cloned object a little bit closer to the camera in the scene
  // TODO: Remove the dependency with AFRAME
  const camera = AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.viewingCamera;
  camera.updateMatrices();

  const sourceObj = world.eid2obj.get(sourceEid)!;
  sourceObj.updateMatrices();

  const objPos = _vec1.setFromMatrixPosition(sourceObj.matrixWorld);
  const cameraPos = _vec2.setFromMatrixPosition(camera.matrixWorld);
  objPos.add(cameraPos.sub(objPos).normalize().multiplyScalar(0.2));
  const clonedMatrixWorld = _mat4.copy(sourceObj.matrixWorld).setPosition(objPos);
  setMatrixWorld(clonedObj, clonedMatrixWorld);
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
    openLink(world, ObjectMenu.targetRef[menu]);
  } else if (clicked(world, ObjectMenu.refreshButtonRef[menu])) {
    console.log("Clicked refresh");
  } else if (clicked(world, ObjectMenu.cloneButtonRef[menu])) {
    cloneObject(world, ObjectMenu.targetRef[menu]);
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
