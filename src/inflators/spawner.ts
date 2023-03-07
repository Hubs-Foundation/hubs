import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import {
  CursorRaycastable,
  HandCollisionTarget,
  ObjectSpawner,
  RemoteHoverTarget,
  SingleActionButton
} from "../bit-components";
import { OBJECT_SPAWNER_FLAGS } from "../bit-systems/object-spawner";
import { COLLISION_LAYERS } from "../constants";
import { inflateMediaLoader } from "./media-loader";
import { inflateRigidBody } from "./rigid-body";

export interface SpawnerParams {
  src: string;
  mediaOptions?: {
    applyGravity?: boolean;
  };
}

export function inflateSpawner(world: HubsWorld, eid: number, props: SpawnerParams) {
  inflateMediaLoader(world, eid, {
    src: props.src,
    recenter: false,
    resize: false,
    animateLoad: false,
    isObjectMenuTarget: false
  });

  addComponent(world, HandCollisionTarget, eid);
  addComponent(world, CursorRaycastable, eid);
  addComponent(world, RemoteHoverTarget, eid);
  addComponent(world, SingleActionButton, eid);

  addComponent(world, ObjectSpawner, eid);
  ObjectSpawner.src[eid] = APP.getSid(props.src);
  ObjectSpawner.flags[eid] = props.mediaOptions?.applyGravity ? OBJECT_SPAWNER_FLAGS.APPLY_GRAVITY : 0;

  inflateRigidBody(world, eid, {
    mass: 0,
    collisionGroup: COLLISION_LAYERS.DEFAULT_SPAWNER,
    collisionMask: COLLISION_LAYERS.INTERACTABLES,
    disableCollision: true
  });
}
