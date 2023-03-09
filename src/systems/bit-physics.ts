import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, Not } from "bitecs";
import { Object3DTag, Rigidbody, PhysicsShape, AEntity } from "../bit-components";
import { Fit, getShapeFromPhysicsShape } from "../inflators/physics-shape";
import { findAncestorWithComponent } from "../utils/bit-utils";
import { Vector3 } from "three";
import { getBodyFromRigidBody } from "../inflators/rigid-body";
import { HubsWorld } from "../app";
import { PhysicsSystem } from "./physics-system";

const rigidbodyQuery = defineQuery([Rigidbody, Object3DTag, Not(AEntity)]);
const rigidbodyEnteredQuery = enterQuery(rigidbodyQuery);
const rigidbodyExitedQuery = exitQuery(rigidbodyQuery);
const shapeQuery = defineQuery([PhysicsShape]);
const shapeEnterQuery = enterQuery(shapeQuery);
const shapeExitQuery = exitQuery(shapeQuery);

const tmpV = new Vector3();

function addPhysicsShapes(world: HubsWorld, physicsSystem: PhysicsSystem, eid: number) {
  const bodyId = PhysicsShape.bodyId[eid];
  const obj = world.eid2obj.get(eid)!;
  if (PhysicsShape.fit[eid] === Fit.ALL) {
    const shape = getShapeFromPhysicsShape(eid);
    const shapeId = physicsSystem.addShapes(bodyId, obj, shape);
    PhysicsShape.shapeId[eid] = shapeId;
  } else {
    const shape = getShapeFromPhysicsShape(eid);
    const shapeId = physicsSystem.addShapes(bodyId, obj, shape);
    PhysicsShape.shapeId[eid] = shapeId;
  }
}

export const physicsCompatSystem = (world: HubsWorld, physicsSystem: PhysicsSystem) => {
  rigidbodyEnteredQuery(world).forEach(eid => {
    const obj = world.eid2obj.get(eid);
    const body = getBodyFromRigidBody(eid);
    const bodyId = physicsSystem.addBody(obj, body);
    Rigidbody.bodyId[eid] = bodyId;
  });

  shapeEnterQuery(world).forEach(eid => {
    const bodyId = Rigidbody.bodyId[eid];
    if (bodyId) {
      PhysicsShape.bodyId[eid] = bodyId;
    } else {
      const bodyEid = findAncestorWithComponent(world, Rigidbody, eid);
      bodyEid && (PhysicsShape.bodyId[eid] = Rigidbody.bodyId[bodyEid]);
    }
    PhysicsShape.bodyId[eid] && addPhysicsShapes(world, physicsSystem, eid);
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
