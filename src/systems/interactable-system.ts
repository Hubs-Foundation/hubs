import { enterQuery, exitQuery, hasComponent, entityExists, defineQuery } from "bitecs";
import { Rigidbody, Constraint, InteractableObject, Owned } from "../bit-components";
import { getBodyTypeFromType } from "../inflators/rigid-body";
import { takeSoftOwnership } from "../utils/take-soft-ownership";
import { JobRunner } from "../utils/coroutine-utils";
import { HubsWorld } from "../app";
import { EntityID } from "../bit-components";
import { sleep } from "../utils/async-utils";

function* setInitialBodyProperties(world: HubsWorld, eid: EntityID) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  InteractableObject.type[eid] = Rigidbody.type[eid];
  physicsSystem.updateRigidBody(eid, {
    type: "kinematic"
  });
  takeSoftOwnership(world, eid);
  yield sleep(1000);
  if (hasComponent(world, Owned, eid)) {
    physicsSystem.updateRigidBody(eid, {
      type: getBodyTypeFromType(InteractableObject.type[eid])
    });
  }
}

const jobs = new JobRunner();
const interactableObjectQuery = defineQuery([InteractableObject, Rigidbody]);
const interactableObjectEnterQuery = enterQuery(interactableObjectQuery);
const interactableObjectExitQuery = exitQuery(interactableObjectQuery);
const heldInteractableObjectsQuery = defineQuery([InteractableObject, Rigidbody, Constraint]);
const exitedHeldInteractableObjectsQuery = exitQuery(heldInteractableObjectsQuery);
const enterHeldInteractableObjectsQuery = enterQuery(heldInteractableObjectsQuery);
export const interactableObjectSystem = (world: HubsWorld) => {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;

  interactableObjectEnterQuery(world).forEach(eid => {
    InteractableObject.type[eid] = Rigidbody.type[eid];
    jobs.add(eid, () => setInitialBodyProperties(world, eid));
  });
  interactableObjectExitQuery(world).forEach(eid => {
    jobs.stop(eid);
  });

  enterHeldInteractableObjectsQuery(world).forEach(eid => {
    physicsSystem.updateRigidBody(eid, {
      type: "dynamic"
    });
  });

  exitedHeldInteractableObjectsQuery(world).forEach(eid => {
    if (
      !entityExists(world, eid) ||
      !(hasComponent(world, InteractableObject, eid) && hasComponent(world, Rigidbody, eid))
    )
      return;

    physicsSystem.updateRigidBody(eid, {
      type: getBodyTypeFromType(InteractableObject.type[eid])
    });
  });
  jobs.tick();
};
