/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { COLLISION_LAYERS } from "../constants";
import { FLOATY_OBJECT_FLAGS } from "../systems/floaty-object-system";

export type MediaParams = {
  src: string;
  resize: boolean;
  recenter: boolean;
};

export function MediaPrefab(params: MediaParams) {
  return (
    <entity
      name="Interactable Media"
      networked
      networkedTransform
      mediaLoader={params}
      deletable
      grabbable
      destroyAtExtremeDistance
      floatyObject={{
        flags: FLOATY_OBJECT_FLAGS.MODIFY_GRAVITY_ON_RELEASE,
        releaseGravity: 0
      }}
      rigidbody={{ collisionGroup: COLLISION_LAYERS.INTERACTABLES, collisionMask: COLLISION_LAYERS.HANDS }}
      physicsShape={{ halfExtents: [0.22, 0.14, 0.1] }} /* TODO Physics shapes*/
      scale={[1, 1, 1]}
    />
  );
}
