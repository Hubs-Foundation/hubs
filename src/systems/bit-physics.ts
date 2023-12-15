import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, Not } from "bitecs";
import {
  Object3DTag,
  Rigidbody,
  PhysicsShape,
  AEntity,
  NetworkedRigidBody,
  Owned,
  EntityID,
  Networked
} from "../bit-components";
import { getShapeFromPhysicsShape } from "../inflators/physics-shape";
import { findAncestorWithComponent } from "../utils/bit-utils";
import { getBodyFromRigidBody, Type } from "../inflators/rigid-body";
import { HubsWorld } from "../app";
import { PhysicsSystem } from "./physics-system";
import { takeSoftOwnership } from "../utils/take-soft-ownership";

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
  const shapeId = physicsSystem.addShapes(bodyId, obj, shape);
  PhysicsShape.shapeId[eid] = shapeId;
}

export function updatePrevBodyType(world: HubsWorld, eid: EntityID) {
  // If someone else owned the entity we want to preserve the prevType state
  if (hasComponent(world, Owned, eid) || Networked.owner[eid] === APP.getSid("reticulum")) {
    Rigidbody.prevType[eid] = Rigidbody.type[eid];
  } else {
    Rigidbody.prevType[eid] = NetworkedRigidBody.prevType[eid];
  }
}

const networkedRigidBodyQuery = defineQuery([Rigidbody, NetworkedRigidBody]);
export const physicsCompatSystem = (world: HubsWorld, physicsSystem: PhysicsSystem) => {
  rigidbodyEnteredQuery(world).forEach(eid => {
    const obj = world.eid2obj.get(eid);
    const body = getBodyFromRigidBody(eid);
    const bodyId = physicsSystem.addBody(obj, body);
    Rigidbody.bodyId[eid] = bodyId;
    if (hasComponent(world, Networked, eid)) {
      takeSoftOwnership(world, eid);
    }
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

  networkedRigidBodyQuery(world).forEach(eid => {
    if (hasComponent(world, Owned, eid)) {
      NetworkedRigidBody.prevType[eid] = Rigidbody.prevType[eid];
    } else {
      Rigidbody.prevType[eid] = NetworkedRigidBody.prevType[eid];
    }
  });
};
