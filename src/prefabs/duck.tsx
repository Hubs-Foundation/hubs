/** @jsx createElementEntity */
import { createElementEntity, EntityDef } from "../utils/jsx-entity";
import { COLLISION_LAYERS } from "../constants";
import { FLOATY_OBJECT_FLAGS } from "../systems/floaty-object-system";
import ducky from "../assets/models/DuckyMesh.glb";
import { getAbsoluteHref } from "../utils/media-url-utils";
import { Fit, Shape } from "../inflators/physics-shape";

export function DuckPrefab(): EntityDef {
  return (
    <entity
      name="Duck"
      networked
      networkedTransform
      mediaLoader={{
        src: getAbsoluteHref(location.href, ducky),
        resize: true,
        recenter: true,
        animateLoad: true,
        isObjectMenuTarget: true
      }}
      quack
      cursorRaycastable
      remoteHoverTarget
      handCollisionTarget
      offersRemoteConstraint
      offersHandConstraint
      floatyObject={{
        flags: FLOATY_OBJECT_FLAGS.HELIUM_WHEN_LARGE
      }}
      destroyAtExtremeDistance
      holdable
      rigidbody={{
        collisionGroup: COLLISION_LAYERS.INTERACTABLES,
        collisionMask:
          COLLISION_LAYERS.HANDS |
          COLLISION_LAYERS.ENVIRONMENT |
          COLLISION_LAYERS.INTERACTABLES |
          COLLISION_LAYERS.AVATAR
      }}
      physicsShape={{
        fit: Fit.MANUAL,
        type: Shape.CYLINDER,
        halfExtents: [0.25, 0.5, 0.45]
      }}
      scale={[1, 1, 1]}
      inspectable
      deletable
      hoverableVisuals
    />
  );
}
