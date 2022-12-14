import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, removeEntity } from "bitecs";
import { Box3, Object3D, Scene } from "three";
import { degToRad } from "three/src/math/MathUtils";
import { HubsWorld } from "../app";
import { Portal } from "../bit-components";
import { CharacterControllerSystem } from "../systems/character-controller-system";
import qsTruthy from "../utils/qs_truthy";

const helpers = new Map();
const AABBS = new Map();

const offset = new THREE.Vector3();
const bounds = new THREE.Vector3();
const listenerPosition = new THREE.Vector3();
const targetPos = new THREE.Vector3();
const targetQuat = new THREE.Quaternion();
const translationMat = new THREE.Matrix4();
const targetMat = new THREE.Matrix4().identity();

const TURN = new THREE.Matrix4().makeRotationY(degToRad(180));

const portalsQuery = defineQuery([Portal]);
const portalsEnterQuery = enterQuery(portalsQuery);
const portalsExitQuery = exitQuery(portalsQuery);

const DEBUG = qsTruthy("debugPortals");

export function portalsSystem(world: HubsWorld, scene: Scene, characterController: CharacterControllerSystem) {
  portalsEnterQuery(world).forEach(portal => {
    const AABB = new Box3();
    AABBS.set(portal, AABB);
    if (DEBUG) {
      const helper = new THREE.Box3Helper(AABB, new THREE.Color(0xffff00));
      helpers.set(portal, helper);
      scene.add(helper);
    }
  });

  portalsExitQuery(world).forEach(portal => {
    removeEntity(world, portal);
    const helper = helpers.get(portal);
    helpers.delete(portal);
    helper.removeFromParent();
    AABBS.delete(portal);
  });

  const portals = portalsQuery(world);
  portals.forEach(portal => {
    const obj = world.eid2obj.get(portal)!;
    const boundsProp = Portal.bounds[portal];
    const offsetProp = Portal.offset[portal];
    offset.set(offsetProp[0], offsetProp[1], offsetProp[2]);
    bounds.set(boundsProp[0], boundsProp[1], boundsProp[2]);

    const AABB = AABBS.get(portal);
    AABB.setFromCenterAndSize(offset, bounds).applyMatrix4(obj.matrixWorld);

    APP.audioListener.getWorldPosition(listenerPosition);
    const isInside = AABB.containsPoint(listenerPosition) ? 1 : 0;
    if (isInside !== Portal.isInside[portal] && isInside) {
      DEBUG && console.log(`You are ${isInside ? "inside" : "outside"} the portal`);

      const target = Portal.target[portal];
      const targetPortal = portals.find(otherPortal => {
        return otherPortal !== portal && Portal.uuid[otherPortal] === target;
      })!;
      const targetObj = world.eid2obj.get(targetPortal);
      if (targetObj) {
        targetObj.updateMatrixWorld(true);
        translationMat.makeTranslation(0, 0, bounds.z * 2);
        targetMat.copy(targetObj.matrixWorld).multiply(TURN).multiply(translationMat);
        characterController.travelByWaypoint(targetMat, true, false);
      }
    }
    Portal.isInside[portal] = AABB.containsPoint(listenerPosition) ? 1 : 0;
  });
}
