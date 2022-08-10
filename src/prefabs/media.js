/** @jsx createElementEntity */
import { createElementEntity, createRef } from "../utils/jsx-entity";
import { COLLISION_LAYERS } from "../constants";
import { LoadingCubePrefab } from "./loading-cube";

export function MediaPrefab({ src, resize, recenter }) {
  const loadingObjectRef = createRef();

  return (
    <entity
      name="Interactable"
      networked
      networked-transform
      media-loader={{ src, loadingObjectRef, resize, recenter }}
      grabbable
      make-kinematic-on-release
      rigidbody={{ collisionGroup: COLLISION_LAYERS.INTERACTABLES, collisionMask: COLLISION_LAYERS.HANDS }}
      physics-shape={{ halfExtents: [0.22, 0.14, 0.1] }} /* TODO Physics shapes*/
      scale={[1, 1, 1]}
    >
      <LoadingCubePrefab ref={loadingObjectRef} />
    </entity>
  );
}
