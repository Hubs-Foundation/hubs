import { COLLISION_LAYERS } from "../constants";
import {
  enterQuery,
  addComponent,
  removeComponent,
  defineComponent,
  defineQuery,
  exitQuery,
  hasComponent,
  Not,
  entityExists
} from "bitecs";
import {
  FloatyObject,
  Owned,
  Rigidbody,
  MakeKinematicOnRelease,
  Constraint,
  NetworkedFloatyObject
} from "../bit-components";

export const MakeStaticWhenAtRest = defineComponent();

const makeStaticAtRestQuery = defineQuery([FloatyObject, Rigidbody, Not(Constraint), MakeStaticWhenAtRest]);
function makeStaticAtRest(world) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  makeStaticAtRestQuery(world).forEach(eid => {
    const isMine = hasComponent(world, Owned, eid);
    if (!isMine) {
      removeComponent(world, MakeStaticWhenAtRest, eid);
      return;
    }

    const bodyId = Rigidbody.bodyId[eid];
    const bodyData = physicsSystem.bodyUuidToData.get(bodyId);
    const isAtRest =
      physicsSystem.bodyInitialized(bodyId) &&
      physicsSystem.getLinearVelocity(bodyId) < bodyData.options.linearSleepingThreshold &&
      physicsSystem.getAngularVelocity(bodyId) < bodyData.options.angularSleepingThreshold;

    if (isAtRest) {
      Object.assign(bodyData.options, {
        type: "kinematic"
      });
      physicsSystem.updateRigidBody(eid, bodyData.options);
      removeComponent(world, MakeStaticWhenAtRest, eid);
    }
  });
}

const makeKinematicOnReleaseExitQuery = exitQuery(defineQuery([Rigidbody, Constraint, MakeKinematicOnRelease]));
function makeKinematicOnRelease(world) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  makeKinematicOnReleaseExitQuery(world).forEach(eid => {
    if (!entityExists(world, eid) || !hasComponent(world, Owned, eid)) return;
    physicsSystem.updateRigidBody(eid, { type: "kinematic" });
  });
}

export const FLOATY_OBJECT_FLAGS = {
  MODIFY_GRAVITY_ON_RELEASE: 1 << 0,
  REDUCE_ANGULAR_FLOAT: 1 << 1,
  UNTHROWABLE: 1 << 2,
  HELIUM_WHEN_LARGE: 1 << 3
};

const enteredFloatyObjectsQuery = enterQuery(defineQuery([FloatyObject, Rigidbody]));
const heldFloatyObjectsQuery = defineQuery([FloatyObject, Rigidbody, Constraint]);
const exitedHeldFloatyObjectsQuery = exitQuery(heldFloatyObjectsQuery);
const enterHeldFloatyObjectsQuery = enterQuery(heldFloatyObjectsQuery);
const networkedFloatyObjectsQuery = defineQuery([FloatyObject, NetworkedFloatyObject]);
export const floatyObjectSystem = world => {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;

  enteredFloatyObjectsQuery(world).forEach(eid => {
    physicsSystem.updateRigidBody(eid, {
      type: "kinematic",
      gravity: { x: 0, y: 0, z: 0 }
    });
  });

  enterHeldFloatyObjectsQuery(world).forEach(eid => {
    physicsSystem.updateRigidBody(eid, {
      gravity: { x: 0, y: 0, z: 0 },
      type: "dynamic",
      collisionFilterMask: COLLISION_LAYERS.HANDS | COLLISION_LAYERS.MEDIA_FRAMES
    });
  });

  exitedHeldFloatyObjectsQuery(world).forEach(eid => {
    if (!entityExists(world, eid) || !(hasComponent(world, FloatyObject, eid) && hasComponent(world, Rigidbody, eid)))
      return;

    const bodyId = Rigidbody.bodyId[eid];
    const bodyData = physicsSystem.bodyUuidToData.get(bodyId);
    if (FloatyObject.flags[eid] & FLOATY_OBJECT_FLAGS.MODIFY_GRAVITY_ON_RELEASE) {
      if (bodyData.linearVelocity < 1.85) {
        physicsSystem.updateRigidBody(eid, {
          gravity: { x: 0, y: 0, z: 0 },
          angularDamping: FloatyObject.flags[eid] & FLOATY_OBJECT_FLAGS.REDUCE_ANGULAR_FLOAT ? 0.89 : 0.5,
          linearDamping: 0.95,
          linearSleepingThreshold: 0.1,
          angularSleepingThreshold: 0.1,
          collisionFilterMask: COLLISION_LAYERS.HANDS | COLLISION_LAYERS.MEDIA_FRAMES
        });
        addComponent(world, MakeStaticWhenAtRest, eid);
      } else {
        physicsSystem.updateRigidBody(eid, {
          gravity: { x: 0, y: FloatyObject.releaseGravity[eid], z: 0 },
          angularDamping: 0.01,
          linearDamping: 0.01,
          linearSleepingThreshold: 1.6,
          angularSleepingThreshold: 2.5,
          collisionFilterMask: COLLISION_LAYERS.DEFAULT_INTERACTABLE
        });
        removeComponent(world, MakeStaticWhenAtRest, eid);
      }
    } else if (FloatyObject.flags[eid] & FLOATY_OBJECT_FLAGS.HELIUM_WHEN_LARGE) {
      const curScale = world.eid2obj.get(eid).scale.x;

      // These three hard-coded values may need to become a property of the FloatyObject
      // component if HELIUM_WHEN_LARGE is used for an entity other than the Duck
      const initialScale = 1;
      const maxScale = 5.0;
      const maxForce = 6.5;

      const ratio = Math.min(1, (curScale - initialScale) / (maxScale - initialScale));
      const force = ratio * maxForce;

      if (force > 0) {
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle);
        const z = Math.sin(angle);
        physicsSystem.updateRigidBody(eid, {
          gravity: { x, y: force, z },
          angularDamping: 0.01,
          linearDamping: 0.01,
          linearSleepingThreshold: 1.6,
          angularSleepingThreshold: 2.5,
          collisionFilterMask: COLLISION_LAYERS.DEFAULT_INTERACTABLE
        });
        removeComponent(world, MakeStaticWhenAtRest, eid);
      }
    } else {
      physicsSystem.updateRigidBody(eid, {
        collisionFilterMask: COLLISION_LAYERS.DEFAULT_INTERACTABLE,
        gravity: { x: 0, y: -9.8, z: 0 }
      });
    }
  });

  networkedFloatyObjectsQuery(world).forEach(eid => {
    if (hasComponent(world, Owned, eid)) {
      NetworkedFloatyObject.flags[eid] = FloatyObject.flags[eid];
    } else {
      FloatyObject.flags[eid] = NetworkedFloatyObject.flags[eid];
    }
  });

  makeStaticAtRest(world);
  makeKinematicOnRelease(world);
};
