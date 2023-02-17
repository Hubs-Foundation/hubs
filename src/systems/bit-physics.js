import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, Not } from "bitecs";
import { Object3DTag, Rigidbody, PhysicsShape, AEntity } from "../bit-components";
import { ACTIVATION_STATE, FIT, SHAPE } from "three-ammo/constants";
// import { holdableButtonSystem } from "./holdable-button-system";
import { findAncestorWithComponent } from "../utils/bit-utils";

const rigidbodyQuery = defineQuery([Rigidbody, Object3DTag, Not(AEntity)]);
const rigidbodyEnteredQuery = enterQuery(rigidbodyQuery);
const rigidbodyExitedQuery = exitQuery(rigidbodyQuery);

const shapeQuery = defineQuery([PhysicsShape, Not(AEntity)]);
const shapeEnterQuery = enterQuery(shapeQuery);
const shapeExitQuery = exitQuery(shapeQuery);

export const RIGIDBODY_FLAGS = {
  DISABLE_COLLISIONS: 1 << 0
};

export const SHAPE_TYPE = {
  BOX: 0,
  HULL: 1,
  MESH: 2
};
const SHAPE_TYPE_MAP = [SHAPE.BOX, SHAPE.HULL, SHAPE.MESH];

export const physicsCompatSystem = world => {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;

  const eids = rigidbodyEnteredQuery(world);
  for (let i = 0; i < eids.length; i++) {
    const eid = eids[i];

    const obj = world.eid2obj.get(eid);

    // TODO these are all hardcoded values, RigidBody should actually have (some of?) these properties
    const bodyId = physicsSystem.addBody(obj, {
      mass: 1,
      gravity: { x: 0, y: Rigidbody.gravity[eid], z: 0 },
      linearDamping: 0.01,
      angularDamping: 0.01,
      linearSleepingThreshold: 1.6,
      angularSleepingThreshold: 2.5,
      angularFactor: { x: 1, y: 1, z: 1 },
      activationState: ACTIVATION_STATE.ACTIVE_TAG,
      emitCollisionEvents: false,
      scaleAutoUpdate: false,
      type: "kinematic",
      disableCollision: Rigidbody.flags[eid] & RIGIDBODY_FLAGS.DISABLE_COLLISIONS,
      collisionFilterGroup: Rigidbody.collisionGroup[eid],
      collisionFilterMask: Rigidbody.collisionMask[eid]
    });
    Rigidbody.bodyId[eid] = bodyId;
  }

  {
    const eids = shapeExitQuery(world);
    for (let i = 0; i < eids.length; i++) {
      const eid = eids[i];
      physicsSystem.removeShapes(PhysicsShape.bodyId[eid], PhysicsShape.shapeId[eid]);
    }
  }

  {
    const eids = shapeEnterQuery(world);
    for (let i = 0; i < eids.length; i++) {
      const eid = eids[i];

      const body = findAncestorWithComponent(world, Rigidbody, eid);
      const bodyId = Rigidbody.bodyId[body];

      if (!bodyId) {
        console.warn("PhysicsShape added to entity hierarchy with no Rigidbody");
        continue;
      }

      const obj = world.eid2obj.get(eid);
      const halfExtents = PhysicsShape.halfExtents[eid];
      const offset = PhysicsShape.offset[eid];

      // TODO same deal for these, many hardcoded values
      const shapeId = physicsSystem.addShapes(bodyId, obj, {
        type: SHAPE_TYPE_MAP[PhysicsShape.type[eid]],
        fit: PhysicsShape.type[eid] !== 0 ? FIT.ALL : FIT.MANUAL,
        halfExtents: { x: halfExtents[0], y: halfExtents[1], z: halfExtents[2] },
        margin: 0.01,
        offset: { x: offset[0], y: offset[1], z: offset[2] }, // TODO this and orientation is odd and probably should just not be a concpet
        orientation: { x: 0, y: 0, z: 0, w: 1 },
        includeInvisible: false
      });
      PhysicsShape.bodyId[eid] = bodyId;
      PhysicsShape.shapeId[eid] = shapeId;
    }
  }

  {
    const eids = rigidbodyExitedQuery(world);
    for (let i = 0; i < eids.length; i++) {
      const eid = eids[i];
      if (entityExists(world, eid) && hasComponent(world, PhysicsShape, eid)) {
        physicsSystem.removeShapes(PhysicsShape.bodyId[eid], PhysicsShape.shapeId[eid]);
        // The PhysicsShape is still on this entity!
      }
      physicsSystem.removeBody(Rigidbody.bodyId[eid]);
    }
  }

  return world;
};
