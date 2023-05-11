import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent } from "bitecs";
import { Matrix4, Quaternion, Vector3 } from "three";
import type { HubsWorld } from "../app";
import {
  HeldRemoteRight,
  HoveredRemoteRight,
  Interacted,
  ObjectMenu,
  ObjectMenuTarget,
  RemoteRight,
  Rigidbody
} from "../bit-components";
import { anyEntityWith, findAncestorWithComponent } from "../utils/bit-utils";
import { createNetworkedEntity } from "../utils/create-networked-entity";
import { createEntityState, deleteEntityState } from "../utils/entity-state-utils";
import HubChannel from "../utils/hub-channel";
import type { EntityID } from "../utils/networking-types";
import { setMatrixWorld } from "../utils/three-utils";
import { deleteTheDeletableAncestor } from "./delete-entity-system";
import { createMessageDatas, isPinned } from "./networking";
import { TRANSFORM_MODE } from "../components/transform-object-button";
import { ScalingHandler } from "../components/scale-button";

// Working variables.
const _vec3_1 = new Vector3();
const _vec3_2 = new Vector3();
const _quat = new Quaternion();
const _mat4 = new Matrix4();

let scalingHandler: ScalingHandler | null = null;

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

  // TODO: position the menu more carefully...
  //       For example, if a menu object is just placed at a target
  //       object's position the menu object can be hidden by a large
  //       target object or the menu object looks too small for a far
  //       target object.
  _mat4.copy(targetObj.matrixWorld);

  // Keeps world scale (1, 1, 1) because
  // a menu object is a child of a target object
  // and the target object's scale can be changed.
  // Another option may be making the menu object
  // a sibling of the target object.
  _mat4.decompose(_vec3_1, _quat, _vec3_2);
  _vec3_2.set(1.0, 1.0, 1.0);
  _mat4.compose(_vec3_1, _quat, _vec3_2);

  const menuObj = world.eid2obj.get(menu)!;
  setMatrixWorld(menuObj, _mat4);

  // TODO: Remove the dependency with AFRAME
  const camera = AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.viewingCamera;
  camera.updateMatrices();
  menuObj.lookAt(_vec3_1.setFromMatrixPosition(camera.matrixWorld));
}

// TODO: startRotation/Scaling() and stopRotation/Scaling() are
//       temporary implementation that rely on the old systems.
//       They should be rewritten more elegantly with bitecs.
function startRotation(world: HubsWorld, targetEid: EntityID) {
  const transformSystem = APP.scene!.systems["transform-selected-object"];
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  physicsSystem.updateRigidBodyOptions(Rigidbody.bodyId[targetEid], { type: "kinematic" });
  const rightCursorEid = anyEntityWith(world, RemoteRight)!;
  transformSystem.startTransform(world.eid2obj.get(targetEid)!, world.eid2obj.get(rightCursorEid)!, {
    mode: TRANSFORM_MODE.CURSOR
  });
}

function stopRotation() {
  const transformSystem = APP.scene!.systems["transform-selected-object"];
  transformSystem.stopTransform();
}

function startScaling(world: HubsWorld, targetEid: EntityID) {
  // TODO: Don't use any
  // TODO: Remove the dependency with AFRAME
  const transformSystem = (AFRAME as any).scenes[0].systems["transform-selected-object"];
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  physicsSystem.updateRigidBodyOptions(Rigidbody.bodyId[targetEid], { type: "kinematic" });
  const rightCursorEid = anyEntityWith(world, RemoteRight)!;
  scalingHandler = new ScalingHandler(world.eid2obj.get(targetEid), transformSystem);
  scalingHandler!.objectToScale = world.eid2obj.get(targetEid);
  scalingHandler!.startScaling(world.eid2obj.get(rightCursorEid));
}

function stopScaling(world: HubsWorld) {
  const rightCursorEid = anyEntityWith(world, RemoteRight)!;
  scalingHandler!.endScaling(world.eid2obj.get(rightCursorEid));
  scalingHandler = null;
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

  const objPos = _vec3_1.setFromMatrixPosition(sourceObj.matrixWorld);
  const cameraPos = _vec3_2.setFromMatrixPosition(camera.matrixWorld);
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
  } else if (clicked(world, ObjectMenu.mirrorButtonRef[menu])) {
    console.log("Clicked mirror");
  }
}

function handleHeldEnter(world: HubsWorld, eid: EntityID, menuEid: EntityID) {
  switch (eid) {
    case ObjectMenu.rotateButtonRef[menuEid]:
      startRotation(world, ObjectMenu.targetRef[menuEid]);
      break;
    case ObjectMenu.scaleButtonRef[menuEid]:
      startScaling(world, ObjectMenu.targetRef[menuEid]);
      break;
  }
}

function handleHeldExit(world: HubsWorld, eid: EntityID, menuEid: EntityID) {
  switch (eid) {
    case ObjectMenu.rotateButtonRef[menuEid]:
      stopRotation();
      break;
    case ObjectMenu.scaleButtonRef[menuEid]:
      stopScaling(world);
      break;
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
const heldQuery = defineQuery([HeldRemoteRight]);
const heldEnterQuery = enterQuery(heldQuery);
const heldExitQuery = exitQuery(heldQuery);
export function objectMenuSystem(world: HubsWorld, sceneIsFrozen: boolean, hubChannel: HubChannel) {
  const menu = anyEntityWith(world, ObjectMenu)!;

  ObjectMenu.targetRef[menu] = objectMenuTarget(world, menu, sceneIsFrozen);
  if (ObjectMenu.targetRef[menu]) {
    handleClicks(world, menu, hubChannel);

    heldExitQuery(world).forEach(eid => {
      handleHeldExit(world, eid, menu);
    });

    heldEnterQuery(world).forEach(eid => {
      handleHeldEnter(world, eid, menu);
    });

    if (scalingHandler !== null) {
      scalingHandler.tick();
    }

    moveToTarget(world, menu);
  }
  updateVisibility(world, menu, sceneIsFrozen);
}
