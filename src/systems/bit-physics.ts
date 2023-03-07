import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, Not } from "bitecs";
import {
  Object3DTag,
  Rigidbody,
  PhysicsShape,
  AEntity,
  AmmoShape,
  BoxCollider,
  Trimesh,
  HeightField
} from "../bit-components";
import { Fit, getShapeFromPhysicsShape, PhysicsShapes } from "../inflators/physics-shape";
import { findAncestorWithComponent, hasAnyComponent } from "../utils/bit-utils";
import { Vector3, Object3D } from "three";
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

function updateOffsets(world: HubsWorld, eid: number, obj: Object3D) {
  // As we don't set offsets for components like ammo-shape that don't have a rigid body, we need to set them here.
  const offset = PhysicsShape.offset[eid].slice();
  if (hasAnyComponent(world, [AmmoShape, HeightField], eid)) {
    offset.set(PhysicsShape.offset[eid]);
  }
  if (hasAnyComponent(world, [BoxCollider, Trimesh, AmmoShape, HeightField], eid)) {
    PhysicsShape.offset[eid].set(obj.position.clone().add(tmpV.fromArray(offset)).toArray());
    PhysicsShape.orientation[eid].set(obj.quaternion.toArray());
    if (hasComponent(world, BoxCollider, eid)) {
      PhysicsShape.halfExtents[eid].set(obj.scale.clone().divideScalar(2).toArray());
    }
  }
}

function addPhysicsShapes(world: HubsWorld, physicsSystem: PhysicsSystem, eid: number) {
  const bodyId = PhysicsShape.bodyId[eid];
  const shapeIds = PhysicsShapes.get(eid)!;
  const obj = world.eid2obj.get(eid)!;
  if (PhysicsShape.fit[eid] === Fit.ALL) {
    updateOffsets(world, eid, obj);
    const shape = getShapeFromPhysicsShape(eid);
    const shapeId = physicsSystem.addShapes(bodyId, obj, shape);
    shapeIds.add(shapeId);
  } else {
    updateOffsets(world, eid, obj);
    const shape = getShapeFromPhysicsShape(eid);
    const shapeId = physicsSystem.addShapes(bodyId, obj, shape);
    shapeIds.add(shapeId);
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

  shapeExitQuery(world).forEach(eid => {
    const shapeIds = PhysicsShapes.get(eid)!;
    shapeIds.forEach(shapeId => {
      physicsSystem.removeShapes(PhysicsShape.bodyId[eid], shapeId);
      shapeIds.delete(shapeId);
    });
  });

  rigidbodyExitedQuery(world).forEach(eid => {
    if (entityExists(world, eid) && hasComponent(world, PhysicsShape, eid)) {
      const shapeIds = PhysicsShapes.get(eid)!;
      shapeIds.forEach(shapeId => {
        physicsSystem.removeShapes(PhysicsShape.bodyId[eid], shapeId);
        shapeIds.delete(shapeId);
      });
      // The PhysicsShape is still on this entity!
    }
    physicsSystem.removeBody(Rigidbody.bodyId[eid]);
  });
};
