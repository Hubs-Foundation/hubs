import { addComponent, defineQuery, enterQuery, entityExists, exitQuery, hasComponent, removeComponent } from "bitecs";
import { Matrix4, Vector3 } from "three";
import type { HubsWorld } from "../app";
import {
  EntityStateDirty,
  ObjectMenuTransform,
  HeldRemoteRight,
  HoveredRemoteRight,
  Interacted,
  Networked,
  ObjectMenu,
  ObjectMenuTarget,
  RemoteRight,
  Rigidbody,
  Deleting,
  MediaLoader,
  ObjectDropped,
  FloatyObject,
  Owned,
  MediaVideo,
  MediaImage,
  MediaPDF,
  MediaMirrored,
  Inspected,
  Inspectable,
  Deletable,
  MediaRefresh,
  MyCameraTool,
  CameraTool
} from "../bit-components";
import {
  anyEntityWith,
  findAncestorWithComponent,
  findAncestorWithComponents,
  hasAnyComponent
} from "../utils/bit-utils";
import { createNetworkedEntity } from "../utils/create-networked-entity";
import HubChannel from "../utils/hub-channel";
import type { EntityID } from "../utils/networking-types";
import { takeOwnership } from "../utils/take-ownership";
import { setMatrixWorld } from "../utils/three-utils";
import { deleteTheDeletableAncestor } from "./delete-entity-system";
import { createMessageDatas, isPinned } from "./networking";
import { TRANSFORM_MODE } from "../components/transform-object-button";
import { ScalingHandler } from "../components/scale-button";
import { canPin, setPinned } from "../utils/bit-pinning-helper";
import { ObjectMenuTransformFlags } from "../inflators/object-menu-transform";
import { COLLISION_LAYERS } from "../constants";
import { FLOATY_OBJECT_FLAGS } from "../systems/floaty-object-system";
import { INSPECTABLE_FLAGS } from "./inspect-system";
import { ObjectMenuPositions } from "../prefabs/object-menu";
// Working variables.
const _vec3_1 = new Vector3();
const _vec3_2 = new Vector3();
const _mat4 = new Matrix4();

let scalingHandler: ScalingHandler | null = null;

export const enum ObjectMenuFlags {
  Visible = 1 << 0
}

function clicked(world: HubsWorld, eid: EntityID) {
  return hasComponent(world, Interacted, eid);
}

function objectMenuTarget(world: HubsWorld, menu: EntityID, sceneIsFrozen: boolean) {
  const held = heldQuery(world).map(eid => eid === ObjectMenu.inspectButtonRef[menu])[0];
  if (held) {
    return ObjectMenu.targetRef[menu];
  }

  if (!sceneIsFrozen) {
    return 0;
  }

  // We can have more than one object menu target in the object hierarchy so we need to explicity look
  // for the root media loader entity.
  // We should probably use something more meaningful to refer to that spawned media root than Deletable.
  // Maybe something like MediaRoot or SpawnedMediaRoot.
  const target = hoveredQuery(world).map(eid =>
    findAncestorWithComponents(world, [Deletable, ObjectMenuTarget], eid)
  )[0];
  if (target) {
    if (hasComponent(world, Deleting, target)) {
      return 0;
    } else {
      ObjectMenu.flags[menu] |= ObjectMenuFlags.Visible;
      return target;
    }
  }

  if (entityExists(world, ObjectMenu.targetRef[menu])) {
    return ObjectMenu.targetRef[menu];
  }
  return 0;
}

// TODO: startRotation/Scaling() and stopRotation/Scaling() are
//       temporary implementation that rely on the old systems.
//       They should be rewritten more elegantly with bitecs.
function startRotation(world: HubsWorld, menuEid: EntityID, targetEid: EntityID) {
  if (hasComponent(world, Networked, targetEid)) {
    takeOwnership(world, targetEid);
  }
  const transformSystem = APP.scene!.systems["transform-selected-object"];
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  physicsSystem.updateRigidBody(Rigidbody.bodyId[targetEid], { type: "kinematic" });
  const rightCursorEid = anyEntityWith(world, RemoteRight)!;
  transformSystem.startTransform(world.eid2obj.get(targetEid)!, world.eid2obj.get(rightCursorEid)!, {
    mode: TRANSFORM_MODE.CURSOR
  });
  ObjectMenu.handlingTargetRef[menuEid] = targetEid;
}

function stopRotation(world: HubsWorld, menuEid: EntityID) {
  // TODO: More proper handling in case the target entity is already removed.
  //       In the worst scenario the entity has been already recycled at this moment
  //       and this code doesn't handled such a case correctly.
  //       We may refactor when we will reimplement the object menu system
  //       by removing A-Frame dependency.
  const handlingTargetEid = ObjectMenu.handlingTargetRef[menuEid];
  if (entityExists(world, handlingTargetEid) && hasComponent(world, Networked, handlingTargetEid)) {
    addComponent(world, EntityStateDirty, handlingTargetEid);
  }
  const transformSystem = APP.scene!.systems["transform-selected-object"];
  transformSystem.stopTransform();
  ObjectMenu.handlingTargetRef[menuEid] = 0;
}

function startScaling(world: HubsWorld, menuEid: EntityID, targetEid: EntityID) {
  if (hasComponent(world, Networked, targetEid)) {
    takeOwnership(world, targetEid);
  }

  // TODO: Don't use any
  // TODO: Remove the dependency with AFRAME
  const transformSystem = (AFRAME as any).scenes[0].systems["transform-selected-object"];
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  physicsSystem.updateRigidBody(Rigidbody.bodyId[targetEid], { type: "kinematic" });
  const rightCursorEid = anyEntityWith(world, RemoteRight)!;
  scalingHandler = new ScalingHandler(world.eid2obj.get(targetEid), transformSystem);
  scalingHandler!.objectToScale = world.eid2obj.get(targetEid);
  scalingHandler!.startScaling(world.eid2obj.get(rightCursorEid));
  ObjectMenu.handlingTargetRef[menuEid] = targetEid;
}

function stopScaling(world: HubsWorld, menuEid: EntityID) {
  const handlingTargetEid = ObjectMenu.handlingTargetRef[menuEid];
  if (entityExists(world, handlingTargetEid) && hasComponent(world, Networked, handlingTargetEid)) {
    addComponent(world, EntityStateDirty, handlingTargetEid);
  }
  const rightCursorEid = anyEntityWith(world, RemoteRight)!;
  scalingHandler!.endScaling(world.eid2obj.get(rightCursorEid));
  scalingHandler = null;
  ObjectMenu.handlingTargetRef[menuEid] = 0;
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

const tmpPos = new Vector3();
function focus(world: HubsWorld, menu: EntityID, track: boolean = false) {
  const myCam = anyEntityWith(APP.world, MyCameraTool);
  if (!myCam) return;

  let target = ObjectMenu.targetRef[menu];
  if (track) {
    const tracking = CameraTool.trackTarget[myCam];
    CameraTool.trackTarget[myCam] = tracking === target ? 0 : target;
  } else {
    const targetObj = world.eid2obj.get(target)!;
    targetObj.getWorldPosition(tmpPos);
    world.eid2obj.get(myCam)!.lookAt(tmpPos);
  }
}

function handleClicks(world: HubsWorld, menu: EntityID, hubChannel: HubChannel) {
  if (clicked(world, ObjectMenu.pinButtonRef[menu])) {
    setPinned(hubChannel, world, ObjectMenu.targetRef[menu], true);
  } else if (clicked(world, ObjectMenu.unpinButtonRef[menu])) {
    setPinned(hubChannel, world, ObjectMenu.targetRef[menu], false);
  } else if (clicked(world, ObjectMenu.cameraFocusButtonRef[menu])) {
    focus(world, menu);
  } else if (clicked(world, ObjectMenu.cameraTrackButtonRef[menu])) {
    focus(world, menu, true);
  } else if (clicked(world, ObjectMenu.removeButtonRef[menu])) {
    ObjectMenu.flags[menu] &= ~ObjectMenuFlags.Visible;
    deleteTheDeletableAncestor(world, ObjectMenu.targetRef[menu]);
  } else if (clicked(world, ObjectMenu.dropButtonRef[menu])) {
    addComponent(world, ObjectDropped, ObjectMenu.targetRef[menu]);
  } else if (clicked(world, ObjectMenu.deserializeDrawingButtonRef[menu])) {
    console.log("Clicked deserialize drawing");
  } else if (clicked(world, ObjectMenu.openLinkButtonRef[menu])) {
    openLink(world, ObjectMenu.targetRef[menu]);
  } else if (clicked(world, ObjectMenu.refreshButtonRef[menu])) {
    addComponent(world, MediaRefresh, ObjectMenu.targetRef[menu]);
  } else if (clicked(world, ObjectMenu.cloneButtonRef[menu])) {
    cloneObject(world, ObjectMenu.targetRef[menu]);
  } else if (clicked(world, ObjectMenu.mirrorButtonRef[menu])) {
    addComponent(world, MediaMirrored, ObjectMenu.targetRef[menu]);
  }
}

function handleHeldEnter(world: HubsWorld, eid: EntityID, menuEid: EntityID) {
  switch (eid) {
    case ObjectMenu.rotateButtonRef[menuEid]:
      ObjectMenu.flags[menuEid] &= ~ObjectMenuFlags.Visible;
      startRotation(world, menuEid, ObjectMenu.targetRef[menuEid]);
      break;
    case ObjectMenu.scaleButtonRef[menuEid]:
      ObjectMenu.flags[menuEid] &= ~ObjectMenuFlags.Visible;
      startScaling(world, menuEid, ObjectMenu.targetRef[menuEid]);
      break;
    case ObjectMenu.inspectButtonRef[menuEid]:
      if (!hasComponent(world, Inspected, ObjectMenu.targetRef[menuEid])) {
        ObjectMenu.flags[menuEid] &= ~ObjectMenuFlags.Visible;
        addComponent(world, Inspected, ObjectMenu.targetRef[menuEid]);
        Inspectable.flags[ObjectMenu.targetRef[menuEid]] |= INSPECTABLE_FLAGS.TARGET_CHANGED;
      }
      break;
  }
}

function handleHeldExit(world: HubsWorld, eid: EntityID, menuEid: EntityID) {
  switch (eid) {
    case ObjectMenu.rotateButtonRef[menuEid]:
      ObjectMenu.flags[menuEid] |= ObjectMenuFlags.Visible;
      stopRotation(world, menuEid);
      break;
    case ObjectMenu.scaleButtonRef[menuEid]:
      ObjectMenu.flags[menuEid] |= ObjectMenuFlags.Visible;
      stopScaling(world, menuEid);
      break;
    case ObjectMenu.inspectButtonRef[menuEid]:
      if (hasComponent(world, Inspected, ObjectMenu.targetRef[menuEid])) {
        ObjectMenu.flags[menuEid] |= ObjectMenuFlags.Visible;
        removeComponent(world, Inspected, ObjectMenu.targetRef[menuEid]);
      }
      break;
  }
}

function updateVisibility(world: HubsWorld, menu: EntityID, frozen: boolean) {
  if (!APP.hubChannel) return;
  let target = ObjectMenu.targetRef[menu];
  const visible = !!(target && frozen) && (ObjectMenu.flags[menu] & ObjectMenuFlags.Visible) !== 0;

  // TODO We are handling menus visibility in a similar way for all the object menus, we
  // should probably refactor this to a common object-menu-visibility-system
  if (visible) {
    ObjectMenuTransform.targetObjectRef[menu] = target;
    ObjectMenuTransform.flags[menu] |= ObjectMenuTransformFlags.Enabled;
  } else {
    ObjectMenuTransform.flags[menu] &= ~ObjectMenuTransformFlags.Enabled;
  }

  const obj = world.eid2obj.get(menu)!;
  obj.visible = visible;

  // We need the media loader entity as that's the entity that's actually pinned and we
  // need to check its state to show/hide certain buttons
  // TODO At this moment all objects that have an object menu have been loaded by a media loader
  // but this might not be true in the future if we allow adding object menus to arbitrary objects.
  const mediaLoader = findAncestorWithComponent(world, MediaLoader, target);
  target = mediaLoader ? mediaLoader : target;

  const canISpawnMove = APP.hubChannel.can("spawn_and_move_media");
  const canIPin = !!(target && canPin(APP.hubChannel, target));
  const isEntityPinned = isPinned(target);
  const media = MediaLoader.mediaRef[target];
  const isVideoImagePdf = hasAnyComponent(world, [MediaVideo, MediaImage, MediaPDF], media);
  const isMirrored = hasComponent(world, MediaMirrored, target);
  const isDropped = hasComponent(world, ObjectDropped, target);
  const isInspectable = hasComponent(world, Inspectable, target);
  const isInspected = hasComponent(world, Inspected, target);
  const isRefreshing = hasComponent(world, MediaRefresh, target);
  const isCameraActive = !!anyEntityWith(APP.world, MyCameraTool);

  const openLinkButtonObj = world.eid2obj.get(ObjectMenu.openLinkButtonRef[menu])!;
  const mirrorButtonObj = world.eid2obj.get(ObjectMenu.mirrorButtonRef[menu])!;
  const inspectButtonObj = world.eid2obj.get(ObjectMenu.inspectButtonRef[menu])!;
  const refreshButtonObj = world.eid2obj.get(ObjectMenu.refreshButtonRef[menu])!;

  openLinkButtonObj.visible = visible;
  mirrorButtonObj.visible = visible && isVideoImagePdf && !isMirrored;
  inspectButtonObj.visible = visible && isInspectable && !isInspected;
  refreshButtonObj.visible = visible && !isRefreshing;

  if (canISpawnMove) {
    world.eid2obj.get(ObjectMenu.unpinButtonRef[menu])!.visible = visible && isEntityPinned && canIPin;
    world.eid2obj.get(ObjectMenu.pinButtonRef[menu])!.visible = visible && !isEntityPinned && canIPin;
    world.eid2obj.get(ObjectMenu.removeButtonRef[menu])!.visible = visible && !isEntityPinned;
    world.eid2obj.get(ObjectMenu.cloneButtonRef[menu])!.visible = visible;
    world.eid2obj.get(ObjectMenu.rotateButtonRef[menu])!.visible = visible && (!isEntityPinned || canIPin);
    world.eid2obj.get(ObjectMenu.scaleButtonRef[menu])!.visible = visible && (!isEntityPinned || canIPin);
    world.eid2obj.get(ObjectMenu.dropButtonRef[menu])!.visible =
      visible && !isVideoImagePdf && !isEntityPinned && !isDropped;

    openLinkButtonObj.position.fromArray(ObjectMenuPositions.openLink);
    mirrorButtonObj.position.fromArray(ObjectMenuPositions.mirror);
    if (isEntityPinned) {
      inspectButtonObj.position.fromArray(ObjectMenuPositions.inspectP);
    } else if (isVideoImagePdf) {
      inspectButtonObj.position.fromArray(ObjectMenuPositions.inspect);
    } else {
      inspectButtonObj.position.fromArray(ObjectMenuPositions.inspectM);
    }
    refreshButtonObj.position.fromArray(ObjectMenuPositions.refresh);

    world.eid2obj.get(ObjectMenu.cameraFocusButtonRef[menu])!.visible = isCameraActive;
    world.eid2obj.get(ObjectMenu.cameraTrackButtonRef[menu])!.visible = isCameraActive;
  } else {
    [
      ObjectMenu.unpinButtonRef[menu],
      ObjectMenu.pinButtonRef[menu],
      ObjectMenu.removeButtonRef[menu],
      ObjectMenu.cloneButtonRef[menu],
      ObjectMenu.rotateButtonRef[menu],
      ObjectMenu.scaleButtonRef[menu],
      ObjectMenu.dropButtonRef[menu],
      ObjectMenu.cameraFocusButtonRef[menu],
      ObjectMenu.cameraTrackButtonRef[menu]
    ].forEach(ref => {
      world.eid2obj.get(ref)!.visible = false;
    });

    openLinkButtonObj.position.fromArray(ObjectMenuPositions.openLinkU);
    mirrorButtonObj.position.fromArray(ObjectMenuPositions.mirrorU);
    inspectButtonObj.position.fromArray(ObjectMenuPositions.inspectU);
    refreshButtonObj.position.fromArray(ObjectMenuPositions.refreshU);
  }

  openLinkButtonObj.matrixNeedsUpdate = true;
  mirrorButtonObj.matrixNeedsUpdate = true;
  inspectButtonObj.matrixNeedsUpdate = true;
  refreshButtonObj.matrixNeedsUpdate = true;

  // This is a hacky way of giving a chance to the object-menu-transform system to center the menu based on the
  // visible buttons without accounting for the background plane.
  const same = ObjectMenuTransform.prevObjectRef[menu] === ObjectMenuTransform.targetObjectRef[menu];
  world.eid2obj.get(ObjectMenu.backgroundRef[menu])!.visible = visible && same;

  // Hide unimplemented features for now.
  // TODO: Implement and show the buttons.
  world.eid2obj.get(ObjectMenu.deserializeDrawingButtonRef[menu])!.visible = false;
}

const hoveredQuery = defineQuery([HoveredRemoteRight]);
const heldQuery = defineQuery([HeldRemoteRight]);
const heldEnterQuery = enterQuery(heldQuery);
const heldExitQuery = exitQuery(heldQuery);
const objectDroppedQuery = defineQuery([ObjectDropped]);
const objectDroppedEnterQuery = enterQuery(objectDroppedQuery);
export function objectMenuSystem(world: HubsWorld, sceneIsFrozen: boolean, hubChannel: HubChannel) {
  const menu = anyEntityWith(world, ObjectMenu)!;

  heldExitQuery(world).forEach(eid => {
    handleHeldExit(world, eid, menu);
  });

  const targetEid = objectMenuTarget(world, menu, sceneIsFrozen);
  ObjectMenu.targetRef[menu] = targetEid;

  if (ObjectMenu.targetRef[menu]) {
    handleClicks(world, menu, hubChannel);

    heldEnterQuery(world).forEach(eid => {
      handleHeldEnter(world, eid, menu);
    });

    if (scalingHandler !== null) {
      scalingHandler.tick();
    }
  }

  objectDroppedEnterQuery(world).forEach(eid => {
    takeOwnership(world, eid);
    if (!hasComponent(world, Owned, eid)) return;

    const physicsSystem = APP.scene?.systems["hubs-systems"].physicsSystem;
    FloatyObject.flags[eid] &= ~FLOATY_OBJECT_FLAGS.MODIFY_GRAVITY_ON_RELEASE;
    physicsSystem.updateRigidBody(eid, {
      type: "dynamic",
      gravity: { x: 0, y: -9.8, z: 0 },
      angularDamping: 0.01,
      linearDamping: 0.01,
      linearSleepingThreshold: 1.6,
      angularSleepingThreshold: 2.5,
      collisionFilterMask: COLLISION_LAYERS.DEFAULT_INTERACTABLE
    });

    physicsSystem.activateBody(Rigidbody.bodyId[eid]);
  });

  updateVisibility(world, menu, sceneIsFrozen);
}
