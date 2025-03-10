/** @jsx createElementEntity */
import { createElementEntity, EntityDef } from "../utils/jsx-entity";
import { COLLISION_LAYERS } from "../constants";
import { FLOATY_OBJECT_FLAGS } from "../systems/floaty-object-system";
import { MediaLoaderParams } from "../inflators/media-loader";
import { Type } from "../inflators/rigid-body";

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
      rigidbody={{
        type: Type.KINEMATIC,
        collisionGroup: COLLISION_LAYERS.INTERACTABLES,
        collisionMask: COLLISION_LAYERS.HANDS
      }}
      scale={[1, 1, 1]}
      inspectable
      hoverableVisuals
    />
  );
}
