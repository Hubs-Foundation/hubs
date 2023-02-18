import { AElement, UserInputSystem } from "aframe";
import { defineQuery, hasComponent } from "bitecs";
import { Selection } from "postprocessing";
import { Mesh, Raycaster, Vector3 } from "three";
import { HubsWorld } from "../app";
import { Carryable, FloatyObject, HoveredRemoteRight, Rigidbody, SceneRoot } from "../bit-components";
import { COLLISION_LAYERS } from "../constants";
import { CharacterControllerSystem } from "../systems/character-controller-system";
import { FLOATY_OBJECT_FLAGS } from "../systems/floaty-object-system";
import { paths } from "../systems/userinput/paths";
import { EntityID } from "../utils/networking-types";
import { takeOwnership } from "../utils/take-ownership";
import { Pose } from "../systems/userinput/pose";
import { anyEntityWith } from "../utils/bit-utils";

enum CarryState {
  NONE,
  MENU,
  CARRYING,
  SNAPPING
}

let carryState = CarryState.NONE;
let activeObject = 0;

function showObjectMenu(eid: EntityID, x: number, y: number) {
  window.dispatchEvent(
    new CustomEvent("show_object_menu", {
      detail: { eid, x, y }
    })
  );
  carryState = CarryState.MENU;
  activeObject = eid;
}
export function clearObjectMenu() {
  window.dispatchEvent(
    new CustomEvent("show_object_menu", {
      detail: null
    })
  );
  carryState = CarryState.NONE;
  activeObject = 0;
}
export function isObjectMenuShowing() {
  return carryState === CarryState.MENU;
}

export function carryObject(eid: EntityID) {
  const world = APP.world;
  console.log("CARRY", eid);
  clearObjectMenu();
  carryState = CarryState.CARRYING;
  activeObject = eid;
  takeOwnership(world, activeObject);

  APP.canvas!.requestPointerLock();

  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  physicsSystem.updateBodyOptions(Rigidbody.bodyId[eid], {
    type: "kinematic",
    gravity: { x: 0, y: 0, z: 0 }
  });
}
function dropObject(world: HubsWorld, applyGravity: boolean) {
  console.log("DROP");
  document.exitPointerLock();
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  const bodyId = Rigidbody.bodyId[activeObject];
  // TODO multiple things have opinions about bodyOptions and they will conflict
  if (applyGravity) {
    physicsSystem.updateBodyOptions(bodyId, {
      type: "dynamic",
      gravity: { x: 0, y: -9.8, z: 0 },
      angularDamping: 0.01,
      linearDamping: 0.01,
      linearSleepingThreshold: 1.6,
      angularSleepingThreshold: 2.5,
      collisionFilterMask: COLLISION_LAYERS.DEFAULT_INTERACTABLE
    });
  } else {
    physicsSystem.updateBodyOptions(bodyId, {
      type: "kinematic",
      gravity: { x: 0, y: 0, z: 0 },
      angularDamping: 0.89,
      linearDamping: 0.95,
      linearSleepingThreshold: 0.1,
      angularSleepingThreshold: 0.1,
      collisionFilterMask: COLLISION_LAYERS.HANDS | COLLISION_LAYERS.MEDIA_FRAMES
    });
  }
  if (hasComponent(world, FloatyObject, activeObject)) {
    FloatyObject.flags[activeObject] &= applyGravity
      ? ~FLOATY_OBJECT_FLAGS.MODIFY_GRAVITY_ON_RELEASE
      : FLOATY_OBJECT_FLAGS.MODIFY_GRAVITY_ON_RELEASE;
  }
  activeObject = 0;
  carryState = CarryState.NONE;
}

export function isCarryingObject() {
  return carryState === CarryState.CARRYING;
}
export function isSnappingObject() {
  return carryState === CarryState.SNAPPING;
}

function addEntityToSelection(world: HubsWorld, selection: Selection, eid: EntityID) {
  world.eid2obj.get(eid)!.traverse(o => (o as Mesh).isMesh && selection.add(o));
}

// TODO pointer locking stuff should be handled in the user input system
let exitedPointerlock = false;
document.addEventListener("pointerlockchange", event => {
  exitedPointerlock = !document.pointerLockElement;
});

const CARRY_HEIGHT = 0.6;
const CARRY_DISTANCE = 0.5;

const tmpWorldPos = new Vector3();
const tmpWorldDir = new Vector3();
const UP = new Vector3(0, 1, 0);
const FORWARD = new Vector3(0, 0, 1);

const raycaster = new Raycaster();
raycaster.near = 0.1;
raycaster.far = 100;
(raycaster as any).firstHitOnly = true; // flag specific to three-mesh-bvh

const queryHoveredRemoteRight = defineQuery([Carryable, HoveredRemoteRight]);
export function carrySystem(
  world: HubsWorld,
  userinput: UserInputSystem,
  characterController: CharacterControllerSystem
) {
  const selection = APP.fx.outlineEffect!.selection;
  selection.clear();
  if (carryState === CarryState.CARRYING) {
    const obj = world.eid2obj.get(activeObject)!;
    const rig = (characterController.avatarRig as AElement).object3D;
    const pov = (characterController.avatarPOV as AElement).object3D;
    rig.getWorldPosition(tmpWorldPos);
    pov.getWorldDirection(tmpWorldDir);
    tmpWorldDir.projectOnPlane(UP).normalize();
    obj.quaternion.setFromUnitVectors(FORWARD, tmpWorldDir);
    tmpWorldDir.multiplyScalar(-CARRY_DISTANCE);
    tmpWorldDir.y = CARRY_HEIGHT;
    tmpWorldPos.add(tmpWorldDir);
    obj.position.copy(tmpWorldPos);
    obj.matrixNeedsUpdate = true;

    if (userinput.get(paths.actions.carry.drop) || exitedPointerlock) {
      dropObject(world, true);
    }

    if (userinput.get(paths.actions.carry.toggle_snap)) {
      carryState = CarryState.SNAPPING;
      document.exitPointerLock();
    }
  } else if (carryState == CarryState.SNAPPING) {
    const currentScene = anyEntityWith(world, SceneRoot)!;

    const cursorPose = userinput.get(paths.actions.cursor.right.pose) as Pose;
    raycaster.ray.origin = cursorPose.position;
    raycaster.ray.direction = cursorPose.direction;
    const intersections = raycaster.intersectObjects([world.eid2obj.get(currentScene)!], true);
    if (intersections.length) {
      const intersection = intersections[0];
      const obj = world.eid2obj.get(activeObject)!;
      // TODO account for object size, orentation can be much smarter
      obj.position.copy(intersection.point);
      obj.quaternion.setFromUnitVectors(UP, intersection.face!.normal);
      obj.matrixNeedsUpdate = true;
    }

    if (userinput.get(paths.actions.carry.toggle_snap)) {
      carryState = CarryState.CARRYING;
      APP.canvas!.requestPointerLock();
    }

    if (userinput.get(paths.actions.carry.drop)) {
      dropObject(world, false);
    }
  } else {
    const hovered = queryHoveredRemoteRight(world)[0];
    if (activeObject) {
      addEntityToSelection(world, selection, activeObject);
    } else if (hovered) {
      addEntityToSelection(world, selection, hovered);

      if (userinput.get(paths.actions.carry.carry)) {
        carryObject(hovered);
      } else if (userinput.get(paths.actions.cursor.right.menu)) {
        const mousePos = userinput.get(paths.device.mouse.pos) as [x: number, y: number]; // TODO this should probably come from cursor pose?
        showObjectMenu(hovered, mousePos[0], mousePos[1]);
      }
    }
  }
  exitedPointerlock = false;
}
