import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, removeComponent } from "bitecs";
import { Object3DTag, Rigidbody, PhysicsShape } from "../bit-components";
import { ACTIVATION_STATE, FIT, SHAPE } from "three-ammo/constants";
// import { holdableButtonSystem } from "./holdable-button-system";

const rigidbodyQuery = defineQuery([Rigidbody, Object3DTag]);
const rigidbodyEnteredQuery = enterQuery(rigidbodyQuery);
const rigidbodyExitedQuery = exitQuery(rigidbodyQuery);
const shapeExitQuery = exitQuery(defineQuery([PhysicsShape]));

export const physicsCompatSystem = world => {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;

  const eids = rigidbodyEnteredQuery(world);
  for (let i = 0; i < eids.length; i++) {
    const eid = eids[i];

    // TODO body-helper aframe component handles this for aframe entities so we skip it here
    if (Rigidbody.bodyId[eid]) {
      continue;
    }

    const obj = world.eid2obj.get(eid);

    // TODO these are all hardcoded values, RigidBody should actually have (some of?) these properties
    const bodyId = physicsSystem.addBody(obj, {
      mass: 1,
      gravity: { x: 0, y: 0, z: 0 },
      linearDamping: 0.01,
      angularDamping: 0.01,
      linearSleepingThreshold: 1.6,
      angularSleepingThreshold: 2.5,
      angularFactor: { x: 1, y: 1, z: 1 },
      activationState: ACTIVATION_STATE.ACTIVE_TAG,
      emitCollisionEvents: false,
      scaleAutoUpdate: false,
      type: "kinematic",
      disableCollision: true,
      collisionFilterGroup: 16,
      collisionFilterMask: 1
    });
    Rigidbody.bodyId[eid] = bodyId;

    // TODO same deal for these, hardcoded, also we may want to support nested shapes
    if (hasComponent(world, PhysicsShape, eid)) {
      const halfExtents = PhysicsShape.halfExtents[eid];
      PhysicsShape.bodyId[eid] = bodyId;
      const shapeId = physicsSystem.addShapes(bodyId, obj, {
        type: SHAPE.BOX,
        fit: FIT.MANUAL,
        halfExtents: { x: halfExtents[0], y: halfExtents[1], z: halfExtents[2] },
        margin: 0.01,
        offset: { x: 0, y: 0, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 }
      });
      PhysicsShape.shapeId[eid] = shapeId;
    }
  }

  {
    const eids = shapeExitQuery(world);
    for (let i = 0; i < eids.length; i++) {
      const eid = eids[i];
      physicsSystem.removeShapes(PhysicsShape.bodyId[eid], PhysicsShape.shapeId[eid]);
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
