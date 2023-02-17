import { AElement, UserInputSystem } from "aframe";
import { defineQuery, hasComponent } from "bitecs";
import { Selection } from "postprocessing";
import { Euler, Mesh, Quaternion, Vector3 } from "three";
import { HubsWorld } from "../app";
import { Carryable, FloatyObject, HoveredRemoteRight, Rigidbody } from "../bit-components";
import { COLLISION_LAYERS } from "../constants";
import { CharacterControllerSystem } from "../systems/character-controller-system";
import { FLOATY_OBJECT_FLAGS } from "../systems/floaty-object-system";
import { paths } from "../systems/userinput/paths";
import { EntityID } from "../utils/networking-types";
import { takeOwnership } from "../utils/take-ownership";

let activeMenu = 0;
let carried = 0;
function showObjectMenu(eid: EntityID, x: number, y: number) {
  window.dispatchEvent(
    new CustomEvent("show_object_menu", {
      detail: { eid, x, y }
    })
  );
  activeMenu = eid;
}
export function clearObjectMenu() {
  window.dispatchEvent(
    new CustomEvent("show_object_menu", {
      detail: null
    })
  );
  activeMenu = 0;
}
export function isObjectMenuShowing() {
  return !!activeMenu;
}

export function carryObject(eid: EntityID) {
  const world = APP.world;
  console.log("CARRY", eid);
  clearObjectMenu();
  carried = eid;
  takeOwnership(world, carried);

  APP.canvas!.requestPointerLock();

  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  physicsSystem.updateBodyOptions(Rigidbody.bodyId[eid], {
    type: "kinematic",
    gravity: { x: 0, y: 0, z: 0 }
  });
}

export function isCarryingObject() {
  return !!carried;
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

const queryHoveredRemoteRight = defineQuery([Carryable, HoveredRemoteRight]);
export function carrySystem(
  world: HubsWorld,
  userinput: UserInputSystem,
  characterController: CharacterControllerSystem
) {
  const selection = APP.fx.outlineEffect!.selection;
  selection.clear();
  if (carried) {
    const obj = world.eid2obj.get(carried)!;
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
      console.log("DROP");
      document.exitPointerLock();
      const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
      // TODO
      physicsSystem.updateBodyOptions(Rigidbody.bodyId[carried], {
        type: "dynamic",
        gravity: { x: 0, y: -9.8, z: 0 },
        angularDamping: 0.01,
        linearDamping: 0.01,
        linearSleepingThreshold: 1.6,
        angularSleepingThreshold: 2.5,
        collisionFilterMask: COLLISION_LAYERS.DEFAULT_INTERACTABLE
      });
      if (hasComponent(world, FloatyObject, carried)) {
        FloatyObject.flags[carried] &= ~FLOATY_OBJECT_FLAGS.MODIFY_GRAVITY_ON_RELEASE;
      }
      carried = 0;
    }
  } else {
    const hovered = queryHoveredRemoteRight(world)[0];
    if (activeMenu) {
      addEntityToSelection(world, selection, activeMenu);
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
