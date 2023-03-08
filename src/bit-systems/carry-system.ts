import { AElement, UserInputSystem } from "aframe";
import { defineQuery, hasComponent } from "bitecs";
import { Selection } from "postprocessing";
import {
  ArrowHelper,
  AxesHelper,
  Box3,
  Camera,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Raycaster,
  Vector3
} from "three";
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
import qsTruthy from "../utils/qs_truthy";
import { takeOwnership } from "../utils/take-ownership";
import { setMatrixWorld } from "../utils/three-utils";

const unlockPointerOnDrop = !qsTruthy("mouselockWhenNotGrabbing") && !qsTruthy("alwaysMouselock");

export enum CarryState {
  NONE,
  MENU,
  CARRYING,
  SNAPPING
}

export enum SnapFace {
  AUTO = -1,
  LEFT,
  FRONT,
  RIGHT,
  TOP,
  BOTTOM,
  BACK
}

type MenuPosition = [x: number, y: number];
export interface CarryStateData {
  activeObject: number;
  rotationOffset: number;
  nudgeOffset: number;
  snapFaceOverride: SnapFace;
  applyGravity: boolean;
  menuPos: MenuPosition;
}

let carryState = CarryState.NONE;
// TODO move this all into a CarryStateData
let activeObject = 0;
let rotationOffset = 0;
let nudgeOffset = 0;
let prevDot = 0;
let snapFaceOverride = SnapFace.AUTO;
let lastIntersectedObj: Mesh | null = null;
let menuPos: MenuPosition = [0, 0];
let applyGravity = true;

let uiNeedsUpdate = false;
function updateUI() {
  window.dispatchEvent(
    new CustomEvent("update_carry_ui", {
      detail: {
        carryState,
        carryStateData: {
          activeObject,
          rotationOffset,
          nudgeOffset,
          snapFaceOverride: snapFaceOverride,
          applyGravity,
          menuPos
        }
      }
    })
  );
}
function showObjectMenu(eid: EntityID, pos: MenuPosition) {
  carryState = CarryState.MENU;
  activeObject = eid;
  menuPos = pos;
  uiNeedsUpdate = true;
}
export function clearObjectMenu() {
  carryState = CarryState.NONE;
  activeObject = 0;
  uiNeedsUpdate = true;
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
  applyGravity = true;
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
  // obj.add(axisHelper);
  uiNeedsUpdate = true;
}
function dropObject(world: HubsWorld, applyGravity: boolean) {
  if (unlockPointerOnDrop) document.exitPointerLock();
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
  arrowHelper.visible = false;
  gridMesh.visible = false;
  uiNeedsUpdate = true;
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
const MIN_SCALE = new Vector3(0.01, 0.01, 0.01);
const X_AXIS = new Vector3(1, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);
const Z_AXIS = new Vector3(0, 0, 1);

const DEFAULT_FLOOR_FACE = SnapFace.BOTTOM;
const DEFAULT_WALL_FACE = SnapFace.BACK;
const DEFAULT_CEIL_FACE = SnapFace.TOP;

// TODO simplify
const QUAT_FOR_FACE = {
  [SnapFace.AUTO]: new Quaternion().setFromAxisAngle(X_AXIS, Math.PI / 2),
  [SnapFace.BOTTOM]: new Quaternion().setFromAxisAngle(X_AXIS, Math.PI / 2),
  [SnapFace.TOP]: new Quaternion().setFromAxisAngle(X_AXIS, -Math.PI / 2),
  [SnapFace.BACK]: new Quaternion(),
  [SnapFace.FRONT]: new Quaternion().setFromAxisAngle(Y_AXIS, Math.PI),
  [SnapFace.LEFT]: new Quaternion().setFromAxisAngle(Y_AXIS, Math.PI / 2),
  [SnapFace.RIGHT]: new Quaternion().setFromAxisAngle(Y_AXIS, -Math.PI / 2)
};
const ROT_AXIS_FOR_FACE = {
  [SnapFace.AUTO]: Y_AXIS,
  [SnapFace.BOTTOM]: Y_AXIS,
  [SnapFace.TOP]: Y_AXIS,
  [SnapFace.BACK]: Z_AXIS,
  [SnapFace.FRONT]: Z_AXIS,
  [SnapFace.LEFT]: X_AXIS,
  [SnapFace.RIGHT]: X_AXIS
};
const AXIS_NAME_FOR_FACE = {
  [SnapFace.AUTO]: "y",
  [SnapFace.BOTTOM]: "y",
  [SnapFace.TOP]: "y",
  [SnapFace.BACK]: "z",
  [SnapFace.FRONT]: "z",
  [SnapFace.LEFT]: "x",
  [SnapFace.RIGHT]: "x"
} as const;

const FLOOR_SNAP_ANGLE = MathUtils.degToRad(45);
const COS_FLOOR_SNAP_ANGLE = Math.cos(FLOOR_SNAP_ANGLE);

const ROTATIONS_PER_SECOND = 4;
const ROTATION_SPEED = (Math.PI * 2) / ROTATIONS_PER_SECOND / 1000;

const SCALE_SPEED = 0.1;
const NUDGE_SPEED = 0.1;
const NUDGE_START_OFFSET = 0.001; // start objects slightly off the surface to avoid any z-fighting, especially on flat objects

const raycaster = new Raycaster();
raycaster.near = 0.1;
raycaster.far = 100;
(raycaster as any).firstHitOnly = true; // flag specific to three-mesh-bvh

const tmpNormalMatrix = new THREE.Matrix3();
let normalHelper: VertexNormalsHelper | null = null;
const arrowHelper = new ArrowHelper();
arrowHelper.setColor(0xffffff);
const axisHelper = new AxesHelper();
const gridMesh = new Mesh(
  undefined,
  new THREE.ShaderMaterial({
    transparent: true,
    toneMapped: false,
    // opacity: 0.1,
    // polygonOffset: true,
    // polygonOffsetFactor: 1,
    // polygonOffsetUnits: 1,
    uniforms: {
      color: { value: new THREE.Color(0xffffff) },
      objectPos: { value: new THREE.Vector3() },
      objectScale: { value: 1.0 }
    },
    vertexShader: `
      varying vec3 vWorld;
      void main()
      {
        vWorld = (modelMatrix * vec4( position, 1.0 )).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4( vWorld, 1.0 );
        // TODO is there a better way to do this?
        // gridMesh shares the exact matrixWorld of the object it is on, nudge depth values to avoid z-fighting
        gl_Position.z -= 0.000001;
      }
    `,
    // TODO this is just using a world aligned grid and rendering all 3 axes.
    // This has some artifacts on non axis aligned surfaces. We can likely improve this.
    fragmentShader: `
varying vec3 vWorld;
uniform vec3 color;
uniform vec3 objectPos;
uniform float objectScale;

void main() {
    vec3 coord = vWorld.xyz * 5.0 + 0.0001; // fudge for flat surfaces perfectly aligned with world axes
    vec3 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);

    float line = 1.0 - min(min(min(grid.x, grid.y), grid.z), 1.0);
    float dist = length(vWorld - objectPos);

    float centerCircle = 1.0 - smoothstep(0.01, 0.03, dist);

    float fadeCore = 0.8 * objectScale;
    float fadedLines = line * (1.0 - smoothstep(fadeCore, fadeCore + 1.5 * objectScale, dist));

    float alpha = min(max(fadedLines, centerCircle), 1.0);

    gl_FragColor = vec4(color, alpha);
}
  `
  })
);

(gridMesh as any).raycast = function () {};
gridMesh.visible = false;

// TODO GC clone/new/etc
function handleSnapping(world: HubsWorld, camera: Camera, userinput: UserInputSystem) {
  if (userinput.get(paths.actions.carry.toggle_snap)) {
    carryState = CarryState.CARRYING;
    gridMesh.visible = false;
    uiNeedsUpdate = true;
    return;
  }
  if (userinput.get(paths.actions.carry.drop) || exitedPointerlock) {
    dropObject(world, false);
    return;
  }
  if (userinput.get(paths.actions.carry.rotate_ccw)) {
    rotationOffset -= ROTATION_SPEED * world.time.delta;
  } else if (userinput.get(paths.actions.carry.rotate_cw)) {
    rotationOffset += ROTATION_SPEED * world.time.delta;
  }
  if (userinput.get(paths.actions.carry.change_snap_face)) {
    snapFaceOverride = (snapFaceOverride + 1) % 6;
    uiNeedsUpdate = true;
  }

  const currentScene = anyEntityWith(world, SceneRoot)!;
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const intersections = raycaster.intersectObjects([world.eid2obj.get(currentScene)!], true);
  if (!intersections.length) return;

  const intersection = intersections[0];
  const obj = world.eid2obj.get(activeObject)!;

  const nudgeDelta = userinput.get<number | undefined>(paths.actions.carry.snap_nudge);
  if (nudgeDelta !== undefined) {
    nudgeOffset += nudgeDelta * world.time.delta * NUDGE_SPEED;
  }

  const scaleDelta = userinput.get<number | undefined>(paths.actions.carry.snap_scale);
  if (scaleDelta !== undefined) {
    obj.scale.addScalar(scaleDelta * world.time.delta * SCALE_SPEED);
  }

  const dir = intersection
    .face!.normal.clone()
    .applyNormalMatrix(tmpNormalMatrix.getNormalMatrix(intersection.object.matrixWorld));

  const target = intersection.point;

  if (!normalHelper) {
    const mesh = intersection.object;
    normalHelper = new VertexNormalsHelper(mesh);
    normalHelper.frustumCulled = false;
    // world.scene.add(normalHelper);
    world.scene.add(arrowHelper);
    world.scene.add(gridMesh);
  }

  if (lastIntersectedObj !== intersection.object) {
    lastIntersectedObj = intersection.object as Mesh;
    normalHelper.object = intersection.object;
    normalHelper.update();

    gridMesh.geometry = lastIntersectedObj.geometry;
    setMatrixWorld(gridMesh, lastIntersectedObj.matrixWorld);
    // rotationOffset = 0;
  }

  const dot = dir.dot(Y_AXIS);
  if (Math.abs(dot - prevDot) > 0.2) {
    rotationOffset = 0;
    nudgeOffset = NUDGE_START_OFFSET;
  }
  prevDot = dot;

  arrowHelper.position.copy(target);
  arrowHelper.setDirection(dir);
  arrowHelper.setLength(nudgeOffset, 0.1, 0.1);
  arrowHelper.matrixNeedsUpdate = true;
  arrowHelper.visible = nudgeOffset !== 0;

  obj.scale.max(MIN_SCALE);

  gridMesh.material.uniforms.objectPos.value.copy(target);
  gridMesh.material.uniforms.objectScale.value = Math.max(size.x, size.y, size.z) * obj.scale.x;

  // TODO we are doing 3 quaternion multiplies, I suspect this can be simplified
  obj.quaternion.setFromRotationMatrix(tmpMat4.lookAt(dir, ZERO, Y_AXIS));

  let snapFace;
  if (snapFaceOverride !== -1) {
    snapFace = snapFaceOverride;
  } else if (Math.abs(dot) >= COS_FLOOR_SNAP_ANGLE) {
    snapFace = dot > 0 ? DEFAULT_FLOOR_FACE : DEFAULT_CEIL_FACE;
  } else {
    snapFace = DEFAULT_WALL_FACE;
  }

  const rotationAxis = ROT_AXIS_FOR_FACE[snapFace];
  const sizeOnAxis = size[AXIS_NAME_FOR_FACE[snapFace]];
  const scaleOnAxis = obj.scale[AXIS_NAME_FOR_FACE[snapFace]];
  // const offsetDistance = (sizeOnAxis / 2 + nudgeOffset) * scaleOnAxis;
  const offsetDistance =
    nudgeOffset < 0 ? (sizeOnAxis / 2 + nudgeOffset) * scaleOnAxis : (sizeOnAxis / 2) * scaleOnAxis + nudgeOffset;

  obj.quaternion.multiply(QUAT_FOR_FACE[snapFace]);
  obj.quaternion.multiply(tmpQuat.setFromAxisAngle(rotationAxis, -rotationOffset));

  target.sub(center.clone().multiply(obj.scale).applyQuaternion(obj.quaternion));
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
  const outlineEffect = APP.fx.outlineEffect!;
  const selection = outlineEffect.selection;
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

    if (userinput.get(paths.actions.carry.toggle_gravity)) {
      applyGravity = !applyGravity;
      uiNeedsUpdate = true;
    }

    if (userinput.get(paths.actions.carry.drop) || exitedPointerlock) {
      dropObject(world, applyGravity);
    }

    if (userinput.get(paths.actions.carry.toggle_snap)) {
      carryState = CarryState.SNAPPING;
      rotationOffset = 0;
      nudgeOffset = NUDGE_START_OFFSET;
      snapFaceOverride = -1;
      gridMesh.visible = true;
      lastIntersectedObj = null;

      uiNeedsUpdate = true;
    }
  } else if (carryState == CarryState.SNAPPING) {
    outlineEffect.visibleEdgeColor.setHex(0xffffff);
    if (nudgeOffset < 0) addEntityToSelection(world, selection, activeObject);
    handleSnapping(world, camera, userinput);
  } else {
    outlineEffect.visibleEdgeColor.setHex(0x08c7f1);
    const hovered = queryHoveredRemoteRight(world)[0];
    if (activeObject) {
      addEntityToSelection(world, selection, activeObject);
    } else if (hovered) {
      addEntityToSelection(world, selection, hovered);

      if (userinput.get(paths.actions.carry.carry)) {
        carryObject(hovered);
      } else if (userinput.get(paths.actions.cursor.right.menu)) {
        const mousePos = userinput.get(paths.device.mouse.pos) as [x: number, y: number]; // TODO this should probably come from cursor pose?
        showObjectMenu(hovered, mousePos);
        document.exitPointerLock();
      }
    }
  }
  if (uiNeedsUpdate) {
    updateUI();
    uiNeedsUpdate = false;
  }
  exitedPointerlock = false;
}
