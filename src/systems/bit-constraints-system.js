import { anyEntityWith } from "../utils/bit-utils";
import { CONSTANTS } from "three-ammo";
const { DISABLE_DEACTIVATION, ACTIVE_TAG } = CONSTANTS.ACTIVATION_STATE;

import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import {
  RemoteRight,
  RemoteLeft,
  HandRight,
  HandLeft,
  HeldRemoteRight,
  HeldRemoteLeft,
  HeldHandRight,
  HeldHandLeft,
  OffersHandConstraint,
  OffersRemoteConstraint,
  Rigidbody
} from "../bit-components";

const queryRemoteRight = defineQuery([HeldRemoteRight, OffersRemoteConstraint, Rigidbody]);
const queryEnterRemoteRight = enterQuery(queryRemoteRight);
const queryExitRemoteRight = exitQuery(queryRemoteRight);

const queryRemoteLeft = defineQuery([HeldRemoteLeft, OffersRemoteConstraint, Rigidbody]);
const queryEnterRemoteLeft = enterQuery(queryRemoteLeft);
const queryExitRemoteLeft = exitQuery(queryRemoteLeft);

const queryHandRight = defineQuery([HeldHandRight, OffersHandConstraint, Rigidbody]);
const queryEnterHandRight = enterQuery(queryHandRight);
const queryExitHandRight = exitQuery(queryHandRight);

const queryHandLeft = defineQuery([HeldHandLeft, OffersHandConstraint, Rigidbody]);
const queryEnterHandLeft = enterQuery(queryHandLeft);
const queryExitHandLeft = exitQuery(queryHandLeft);

const grabBodyOptions = { type: "dynamic", activationState: DISABLE_DEACTIVATION };
const releaseBodyOptions = { activationState: ACTIVE_TAG };

function add(physicsSystem, interactor, entities) {
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    physicsSystem.updateBodyOptions(Rigidbody.bodyId[eid], grabBodyOptions);
    physicsSystem.addConstraint(interactor, Rigidbody.bodyId[eid], Rigidbody.bodyId[interactor], {});
  }
}

function remove(world, offersConstraint, physicsSystem, interactor, entities) {
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    if (hasComponent(world, offersConstraint, eid) && hasComponent(world, Rigidbody, eid)) {
      physicsSystem.updateBodyOptions(Rigidbody.bodyId[eid], releaseBodyOptions);
      physicsSystem.removeConstraint(interactor);
    }
  }
}

export function constraintsSystem(world) {
  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  add(physicsSystem, anyEntityWith(world, RemoteRight), queryEnterRemoteRight(world));
  add(physicsSystem, anyEntityWith(world, RemoteLeft), queryEnterRemoteLeft(world));
  add(physicsSystem, anyEntityWith(world, HandRight), queryEnterHandRight(world));
  add(physicsSystem, anyEntityWith(world, HandLeft), queryEnterHandLeft(world));
  remove(world, OffersRemoteConstraint, physicsSystem, anyEntityWith(world, RemoteRight), queryExitRemoteRight(world));
  remove(world, OffersRemoteConstraint, physicsSystem, anyEntityWith(world, RemoteLeft), queryExitRemoteLeft(world));
  remove(world, OffersHandConstraint, physicsSystem, anyEntityWith(world, HandRight), queryExitHandRight(world));
  remove(world, OffersHandConstraint, physicsSystem, anyEntityWith(world, HandLeft), queryExitHandLeft(world));
}
