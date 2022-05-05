const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;
import {
  enterQuery,
  addComponent,
  removeComponent,
  defineComponent,
  defineQuery,
  exitQuery,
  hasComponent,
  Not
} from "bitecs";

export const MakeStaticWhenAtRest = defineComponent();

import { FloatyObject, Rigidbody, Held } from "../utils/jsx-entity";

const heldFloatyObjectsQuery = defineQuery([FloatyObject, Rigidbody, Held]);
const exitedHeldFloatyObjectsQuery = exitQuery(heldFloatyObjectsQuery);
const enterHeldFloatyObjectsQuery = enterQuery(heldFloatyObjectsQuery);

const makeStaticQuery = defineQuery([FloatyObject, Rigidbody, Not(Held), MakeStaticWhenAtRest]);

export const floatyObjectSystem = world => {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;

  {
    const ents = enterHeldFloatyObjectsQuery(world);
    for (let i = 0; i < ents.length; i++) {
      const eid = ents[i];
      const bodyId = Rigidbody.bodyId[eid];
      const bodyData = physicsSystem.bodyUuidToData.get(bodyId);
      Object.assign(bodyData.options, {
        gravity: { x: 0, y: 0, z: 0 },
        type: "dynamic",
        collisionFilterMask: COLLISION_LAYERS.HANDS | COLLISION_LAYERS.MEDIA_FRAMES
      });
      physicsSystem.updateBody(bodyId, bodyData.options);
    }
  }

  {
    const ents = exitedHeldFloatyObjectsQuery(world);
    for (let i = 0; i < ents.length; i++) {
      const eid = ents[i];
      if (!(hasComponent(world, FloatyObject, eid) && hasComponent(world, Rigidbody, eid))) continue;

      const bodyId = Rigidbody.bodyId[eid];
      const bodyData = physicsSystem.bodyUuidToData.get(bodyId);

      if (bodyData.linearVelocity < 1.85) {
        Object.assign(bodyData.options, {
          gravity: { x: 0, y: 0, z: 0 },
          angularDamping: 0.5, // What's the best amount of angular damping?
          linearDamping: 0.95,
          linearSleepingThreshold: 0.1,
          angularSleepingThreshold: 0.1,
          collisionFilterMask: COLLISION_LAYERS.HANDS | COLLISION_LAYERS.MEDIA_FRAMES
        });
        addComponent(world, MakeStaticWhenAtRest, eid);
      } else {
        Object.assign(bodyData.options, {
          gravity: { x: 0, y: -2, z: 0 },
          angularDamping: 0.01,
          linearDamping: 0.01,
          linearSleepingThreshold: 1.6,
          angularSleepingThreshold: 2.5,
          collisionFilterMask: COLLISION_LAYERS.DEFAULT_INTERACTABLE
        });
        removeComponent(world, MakeStaticWhenAtRest, eid);
      }
      physicsSystem.updateBody(bodyId, bodyData.options);
    }
  }

  const makeStaticEnts = makeStaticQuery(world);

  for (let i = 0; i < makeStaticEnts.length; i++) {
    const eid = makeStaticEnts[i];

    const el = world.eid2obj.get(eid).el;
    const isMine = el.components.networked && NAF.utils.isMine(el);
    if (!isMine) {
      removeComponent(world, MakeStaticWhenAtRest, eid);
      continue;
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
      physicsSystem.updateBody(bodyId, bodyData.options);
      removeComponent(world, MakeStaticWhenAtRest, eid);
    }
  }

  return world;
};
