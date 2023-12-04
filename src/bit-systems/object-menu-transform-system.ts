import { defineQuery } from "bitecs";
import { HubsWorld } from "../app";
import { ObjectMenuTarget, ObjectMenuTransform } from "../bit-components";
import { EntityID } from "../utils/networking-types";
import { Box3, Matrix4, Object3D, Quaternion, Sphere, Vector3 } from "three";
import { isFacingCamera, setFromObject, setMatrixWorld } from "../utils/three-utils";
import { ObjectMenuTargetFlags } from "../inflators/object-menu-target";
import { ObjectMenuTransformFlags } from "../inflators/object-menu-transform";

const offset = new Vector3();
const tmpVec1 = new Vector3();
const tmpVec2 = new Vector3();
const tmpQuat1 = new Quaternion();
const tmpQuat2 = new Quaternion();
const tmpMat4 = new Matrix4();
const tmpMat42 = new Matrix4();
const aabb = new Box3();
const sphere = new Sphere();
const yVector = new Vector3(0, 1, 0);

// Calculate the AABB without accounting for the root object rotation
function getAABB(obj: Object3D, box: Box3, onlyVisible: boolean = false) {
  const parent = obj.parent;
  obj.removeFromParent();
  obj.updateMatrices(true, true);
  tmpMat4.copy(obj.matrixWorld);
  tmpMat4.decompose(tmpVec1, tmpQuat1, tmpVec2);
  tmpQuat2.copy(tmpQuat1);
  obj.quaternion.identity();
  obj.updateMatrix();
  obj.updateMatrixWorld();
  setFromObject(box, obj, onlyVisible);
  parent?.add(obj);
  obj.quaternion.copy(tmpQuat2);
  obj.updateMatrix();
  obj.updateMatrixWorld();
}

// Check https://github.com/mozilla/hubs/pull/6289#issuecomment-1739003555 for implementation details.
function transformMenu(world: HubsWorld, menu: EntityID) {
  const targetEid = ObjectMenuTransform.targetObjectRef[menu];
  const targetObj = world.eid2obj.get(targetEid);
  const enabled = (ObjectMenuTransform.flags[menu] & ObjectMenuTransformFlags.Enabled) !== 0 ? true : false;
  if (!targetObj || !enabled) return;

  const menuObj = world.eid2obj.get(menu)!;

  // Calculate the menu offset based on visible elements
  const center = (ObjectMenuTransform.flags[menu] & ObjectMenuTransformFlags.Center) !== 0 ? true : false;
  if (center && ObjectMenuTransform.targetObjectRef[menu] !== ObjectMenuTransform.prevObjectRef[menu]) {
    getAABB(menuObj, aabb);
    aabb.getCenter(tmpVec1);
    getAABB(menuObj, aabb, true);
    aabb.getCenter(tmpVec2);
    offset.subVectors(tmpVec1, tmpVec2);
    offset.z = 0;
  }

  const camera = APP.scene?.systems["hubs-systems"].cameraSystem.viewingCamera;
  camera.updateMatrices();

  const isFlat = (ObjectMenuTarget.flags[targetEid] & ObjectMenuTargetFlags.Flat) !== 0 ? true : false;
  if (!isFlat) {
    getAABB(targetObj, aabb);
    aabb.getBoundingSphere(sphere);

    tmpMat4.copy(targetObj.matrixWorld);
    tmpMat4.decompose(tmpVec1, tmpQuat1, tmpVec2);
    tmpVec2.set(1.0, 1.0, 1.0);
    tmpMat4.compose(sphere.center, tmpQuat1, tmpVec2);

    setMatrixWorld(menuObj, tmpMat4);

    menuObj.lookAt(tmpVec2.setFromMatrixPosition(camera.matrixWorld));
    menuObj.translateZ(sphere.radius);

    if (center) {
      menuObj.position.add(offset);
      menuObj.matrixNeedsUpdate = true;
    }

    // TODO We need to handle the menu positioning when the player is inside the bounding sphere.
    // For now we are defaulting to the current AFrame behavior.
  } else {
    targetObj.updateMatrices(true, true);
    tmpMat4.copy(targetObj.matrixWorld);
    tmpMat4.decompose(tmpVec1, tmpQuat1, tmpVec2);

    const isFacing = isFacingCamera(targetObj);
    if (!isFacing) {
      tmpQuat1.setFromAxisAngle(yVector, Math.PI);
      tmpMat42.makeRotationFromQuaternion(tmpQuat1);
      tmpMat4.multiply(tmpMat42);
    }

    if (center) {
      tmpMat42.makeTranslation(offset.x, offset.y, offset.z);
      tmpMat4.multiply(tmpMat42);
    }

    setMatrixWorld(menuObj, tmpMat4);
  }
  ObjectMenuTransform.prevObjectRef[menu] = ObjectMenuTransform.targetObjectRef[menu];
}

const menuQuery = defineQuery([ObjectMenuTransform]);

export function objectMenuTransformSystem(world: HubsWorld) {
  menuQuery(world).forEach(menu => {
    transformMenu(world, menu);
  });
}
