import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, Not } from "bitecs";
import { Object3DTag, Rigidbody, PhysicsShape, AEntity, SceneRoot } from "../bit-components";
import { getShapeFromPhysicsShape } from "../inflators/physics-shape";
import { findAncestorWithComponent } from "../utils/bit-utils";
import { getBodyFromRigidBody } from "../inflators/rigid-body";
import { HubsWorld } from "../app";
import { PhysicsSystem } from "./physics-system";
import { Quaternion, Vector3 } from "three";
import { CONSTANTS } from "three-ammo";

const rigidbodyQuery = defineQuery([Rigidbody, Object3DTag, Not(AEntity)]);
const rigidbodyEnteredQuery = enterQuery(rigidbodyQuery);
const rigidbodyExitedQuery = exitQuery(rigidbodyQuery);
const shapeQuery = defineQuery([PhysicsShape]);
const shapeEnterQuery = enterQuery(shapeQuery);
const shapeExitQuery = exitQuery(shapeQuery);

function addPhysicsShapes(world: HubsWorld, physicsSystem: PhysicsSystem, eid: number) {
  const bodyId = PhysicsShape.bodyId[eid];
  const obj = world.eid2obj.get(eid)!;
  const shape = getShapeFromPhysicsShape(eid);

  // TODO HACK this should be handled in shape generation code or just be unsupported
  const isSceneObject = !!findAncestorWithComponent(world, SceneRoot, eid);
  if (isSceneObject && !hasComponent(world, Rigidbody, eid) && shape.fit === CONSTANTS.FIT.ALL) {
    obj.updateMatrices();
    const offset = new Vector3().copy(shape.offset as Vector3);
    const orientation = new Quaternion().copy(shape.orientation as Quaternion);
    offset.applyMatrix4(obj.matrixWorld);
    orientation.multiply(obj.getWorldQuaternion(new Quaternion()));
    shape.offset.x += offset.x;
    shape.offset.y += offset.y;
    shape.offset.z += offset.z;
    shape.orientation.x = orientation.x;
    shape.orientation.y = orientation.y;
    shape.orientation.z = orientation.z;
    shape.orientation.w = orientation.w;
  }

  const shapeId = physicsSystem.addShapes(bodyId, obj, shape);
  PhysicsShape.shapeId[eid] = shapeId;
}

export const physicsCompatSystem = (world: HubsWorld, physicsSystem: PhysicsSystem) => {
  rigidbodyEnteredQuery(world).forEach(eid => {
    const obj = world.eid2obj.get(eid);
    const body = getBodyFromRigidBody(eid);
    const bodyId = physicsSystem.addBody(obj, body);
    Rigidbody.bodyId[eid] = bodyId;
  });

  shapeEnterQuery(world).forEach(eid => {
    const bodyEid = findAncestorWithComponent(world, Rigidbody, eid);
    if (bodyEid) {
      PhysicsShape.bodyId[eid] = Rigidbody.bodyId[bodyEid];
      addPhysicsShapes(world, physicsSystem, eid);
    } else {
      console.warn(`Could find a body for shape in entity ${eid}`);
    }
  });

  shapeExitQuery(world).forEach(eid => physicsSystem.removeShapes(PhysicsShape.bodyId[eid], PhysicsShape.shapeId[eid]));

  rigidbodyExitedQuery(world).forEach(eid => {
    if (entityExists(world, eid) && hasComponent(world, PhysicsShape, eid)) {
      physicsSystem.removeShapes(PhysicsShape.bodyId[eid], PhysicsShape.shapeId[eid]);
      // The PhysicsShape is still on this entity!
    }
    physicsSystem.removeBody(Rigidbody.bodyId[eid]);
  });
};
