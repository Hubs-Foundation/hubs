/** @jsx createElementEntity */
import { createElementEntity, EntityDef } from "../utils/jsx-entity";
import { COLLISION_LAYERS } from "../constants";
import { FLOATY_OBJECT_FLAGS } from "../systems/floaty-object-system";
import { MediaLoaderParams } from "../inflators/media-loader";

export function MediaPrefab(params: MediaLoaderParams): EntityDef {
  return (
    <entity
      name="Interactable Media"
      networked
      networkedTransform
      mediaLoader={params}
      deletable
      grabbable={{ cursor: true, hand: true }}
      destroyAtExtremeDistance
      floatyObject={{
        flags: FLOATY_OBJECT_FLAGS.MODIFY_GRAVITY_ON_RELEASE,
        releaseGravity: 0
      }}
      networkedFloatyObject={{
        flags: FLOATY_OBJECT_FLAGS.MODIFY_GRAVITY_ON_RELEASE
      }}
      rigidbody={{ collisionGroup: COLLISION_LAYERS.INTERACTABLES, collisionMask: COLLISION_LAYERS.HANDS }}
      physicsShape={{ halfExtents: [0.22, 0.14, 0.1] }} /* TODO Physics shapes*/
      scale={[1, 1, 1]}
    />
  );
}
