/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { COLLISION_LAYERS } from "../constants";

export function MediaPrefab({ src, resize, recenter }) {
  return (
    <entity
      name="Interactable Media"
      networked
      networkedTransform
      mediaLoader={{ src, resize, recenter }}
      deletable
      grabbable
      destroyAtExtremeDistance
      makeKinematicOnRelease
      rigidbody={{ collisionGroup: COLLISION_LAYERS.INTERACTABLES, collisionMask: COLLISION_LAYERS.HANDS }}
      physicsShape={{ halfExtents: [0.22, 0.14, 0.1] }} /* TODO Physics shapes*/
      scale={[1, 1, 1]}
    />
  );
}
