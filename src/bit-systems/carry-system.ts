import { AElement, UserInputSystem } from "aframe";
import { defineQuery, hasComponent } from "bitecs";
import { Selection } from "postprocessing";
import { ArrowHelper, AxesHelper, Box3, Camera, MathUtils, Matrix4, Mesh, Quaternion, Raycaster, Vector3 } from "three";
import { VertexNormalsHelper } from "three/examples/jsm/helpers/VertexNormalsHelper";
import { HubsWorld } from "../app";
import { Carryable, FloatyObject, HoveredRemoteRight, Rigidbody, SceneRoot } from "../bit-components";
import { COLLISION_LAYERS } from "../constants";
import { CharacterControllerSystem } from "../systems/character-controller-system";
import { FLOATY_OBJECT_FLAGS } from "../systems/floaty-object-system";
import { paths } from "../systems/userinput/paths";
import { computeLocalBoundingBox } from "../utils/auto-box-collider";
import { anyEntityWith } from "../utils/bit-utils";
import { EntityID } from "../utils/networking-types";
import { takeOwnership } from "../utils/take-ownership";

enum CarryState {
  NONE,
  MENU,
  CARRYING,
  SNAPPING
}

let carryState = CarryState.NONE;
let activeObject = 0;
let rotationOffset = 0;
let prevDot = 0;
let snapFaceOverrideIdx = -1;

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

const tmpBox = new Box3();
const center = new Vector3();
const size = new Vector3();

export function carryObject(eid: EntityID) {
  const world = APP.world;
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

  const obj = APP.world.eid2obj.get(eid)!;
  computeLocalBoundingBox(obj, tmpBox, true);
  tmpBox.getCenter(center);
  tmpBox.getSize(size);
  obj.add(axisHelper);
}
function dropObject(world: HubsWorld, applyGravity: boolean) {
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
  axisHelper.removeFromParent();
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
const tmpQuat = new Quaternion();
const tmpMat4 = new Matrix4();

const ZERO = new Vector3(0, 0, 0);
const X_AXIS = new Vector3(1, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);
const Z_AXIS = new Vector3(0, 0, 1);

enum SNAP_FACE {
  BOTTOM,
  TOP,
  FRONT,
  BACK,
  LEFT,
  RIGHT
}
const SNAP_FACES = [SNAP_FACE.LEFT, SNAP_FACE.FRONT, SNAP_FACE.RIGHT, SNAP_FACE.TOP, SNAP_FACE.BOTTOM, SNAP_FACE.BACK];
const DEFAULT_FLOOR_FACE_IDX = SNAP_FACES.indexOf(SNAP_FACE.BOTTOM);
const DEFAULT_WALL_FACE_IDX = SNAP_FACES.indexOf(SNAP_FACE.BACK);
const DEFAULT_CEIL_FACE_IDX = SNAP_FACES.indexOf(SNAP_FACE.TOP);

// TODO simplify
const QUAT_FOR_FACE = {
  [SNAP_FACE.BOTTOM]: new Quaternion().setFromAxisAngle(X_AXIS, Math.PI / 2),
  [SNAP_FACE.TOP]: new Quaternion().setFromAxisAngle(X_AXIS, -Math.PI / 2),
  [SNAP_FACE.BACK]: new Quaternion(),
  [SNAP_FACE.FRONT]: new Quaternion().setFromAxisAngle(Y_AXIS, Math.PI),
  [SNAP_FACE.LEFT]: new Quaternion().setFromAxisAngle(Y_AXIS, Math.PI / 2),
  [SNAP_FACE.RIGHT]: new Quaternion().setFromAxisAngle(Y_AXIS, -Math.PI / 2)
};
const ROT_AXIS_FOR_FACE = {
  [SNAP_FACE.BOTTOM]: Y_AXIS,
  [SNAP_FACE.TOP]: Y_AXIS,
  [SNAP_FACE.BACK]: Z_AXIS,
  [SNAP_FACE.FRONT]: Z_AXIS,
  [SNAP_FACE.LEFT]: X_AXIS,
  [SNAP_FACE.RIGHT]: X_AXIS
};
const AXIS_FOR_FACE = {
  [SNAP_FACE.BOTTOM]: "y",
  [SNAP_FACE.TOP]: "y",
  [SNAP_FACE.BACK]: "z",
  [SNAP_FACE.FRONT]: "z",
  [SNAP_FACE.LEFT]: "x",
  [SNAP_FACE.RIGHT]: "x"
};

const FLOOR_SNAP_ANGLE = MathUtils.degToRad(45);
const COS_FLOOR_SNAP_ANGLE = Math.cos(FLOOR_SNAP_ANGLE);

const ROTATIONS_PER_SECOND = 4;
const ROTATION_SPEED = (Math.PI * 2) / ROTATIONS_PER_SECOND / 1000;

const raycaster = new Raycaster();
raycaster.near = 0.1;
raycaster.far = 100;
(raycaster as any).firstHitOnly = true; // flag specific to three-mesh-bvh

const tmpNormalMatrix = new THREE.Matrix3();
let normalHelper: VertexNormalsHelper | null = null;
const arrowHelper = new ArrowHelper();
const axisHelper = new AxesHelper();

// TODO GC clone/new/etc
function handleSnapping(world: HubsWorld, camera: Camera, userinput: UserInputSystem) {
  if (userinput.get(paths.actions.carry.toggle_snap)) {
    carryState = CarryState.CARRYING;
    return;
  }
  if (userinput.get(paths.actions.carry.drop)) {
    dropObject(world, false);
    return;
  }
  if (userinput.get(paths.actions.carry.rotate_ccw)) {
    rotationOffset -= ROTATION_SPEED * world.time.delta;
  } else if (userinput.get(paths.actions.carry.rotate_cw)) {
    rotationOffset += ROTATION_SPEED * world.time.delta;
  }
  if (userinput.get(paths.actions.carry.change_snap_face)) {
    snapFaceOverrideIdx = (snapFaceOverrideIdx + 1) % 6;
  }

  const currentScene = anyEntityWith(world, SceneRoot)!;
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const intersections = raycaster.intersectObjects([world.eid2obj.get(currentScene)!], true);
  if (!intersections.length) return;

  const intersection = intersections[0];
  const obj = world.eid2obj.get(activeObject)!;

  const dir = intersection
    .face!.normal.clone()
    .applyNormalMatrix(tmpNormalMatrix.getNormalMatrix(intersection.object.matrixWorld));

  const target = intersection.point;

  if (!normalHelper) {
    const mesh = intersection.object;
    normalHelper = new VertexNormalsHelper(mesh);
    normalHelper.frustumCulled = false;
    world.scene.add(normalHelper);
    world.scene.add(arrowHelper);
  }

  if (normalHelper.object !== intersection.object) {
    normalHelper.object = intersection.object;
    normalHelper.update();
    // rotationOffset = 0;
  }

  arrowHelper.position.copy(target);
  arrowHelper.setDirection(dir);
  arrowHelper.matrixNeedsUpdate = true;

  const dot = dir.dot(Y_AXIS);
  if (Math.abs(dot - prevDot) > 0.2) {
    rotationOffset = 0;
  }
  prevDot = dot;

  // TODO we are doing 3 different rotations, i think they can be combined into 1 transformation
  obj.quaternion.setFromRotationMatrix(tmpMat4.lookAt(dir, ZERO, Y_AXIS));

  let snapFace;
  if (snapFaceOverrideIdx !== -1) {
    snapFace = SNAP_FACES[snapFaceOverrideIdx];
  } else if (Math.abs(dot) >= COS_FLOOR_SNAP_ANGLE) {
    snapFace = SNAP_FACES[dot > 0 ? DEFAULT_FLOOR_FACE_IDX : DEFAULT_CEIL_FACE_IDX];
  } else {
    snapFace = SNAP_FACES[DEFAULT_WALL_FACE_IDX];
  }

  const rotationAxis = ROT_AXIS_FOR_FACE[snapFace];
  const offsetDistance = ((size as any)[AXIS_FOR_FACE[snapFace]] as number) / 2;

  obj.quaternion.multiply(QUAT_FOR_FACE[snapFace]);
  obj.quaternion.multiply(tmpQuat.setFromAxisAngle(rotationAxis, -rotationOffset));

  target.sub(center.clone().applyQuaternion(obj.quaternion));
  target.addScaledVector(dir, offsetDistance);
  obj.position.copy(target);

  obj.matrixNeedsUpdate = true;
}

const queryHoveredRemoteRight = defineQuery([Carryable, HoveredRemoteRight]);
export function carrySystem(
  world: HubsWorld,
  userinput: UserInputSystem,
  characterController: CharacterControllerSystem,
  camera: Camera
) {
  const selection = APP.fx.outlineEffect!.selection;
  selection.clear();
  if (carryState === CarryState.CARRYING) {
    const obj = world.eid2obj.get(activeObject)!;
    const rig = (characterController.avatarRig as AElement).object3D;
    const pov = (characterController.avatarPOV as AElement).object3D;
    rig.getWorldPosition(tmpWorldPos);
    pov.getWorldDirection(tmpWorldDir);
    tmpWorldDir.projectOnPlane(Y_AXIS).normalize();
    obj.quaternion.setFromUnitVectors(Z_AXIS, tmpWorldDir);
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
      rotationOffset = 0;
      snapFaceOverrideIdx = -1;
    }
  } else if (carryState == CarryState.SNAPPING) {
    handleSnapping(world, camera, userinput);
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
