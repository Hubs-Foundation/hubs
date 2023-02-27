/** @jsx createElementEntity */
import { createElementEntity, EntityDef } from "../utils/jsx-entity";
import { COLLISION_LAYERS } from "../constants";
import { Color, MeshStandardMaterial } from "three";

const material = new MeshStandardMaterial();
material.transparent = true;
material.opacity = 0.25;
material.color = new Color(0.8, 0.2, 0.8);

export function RoomPortalPrefab(roomLink: string): EntityDef {
  return (
    <entity
      name="Room Portal"
      networked
      roomPortal={{ src: roomLink }}
      deletable
      rigidbody={{ collisionGroup: COLLISION_LAYERS.ROOM_PORTAL, collisionMask: COLLISION_LAYERS.AVATAR }}
      physicsShape={{ halfExtents: [1.0, 1.5, 1.0] }}
      object3D={new THREE.Mesh(new THREE.BoxBufferGeometry(2, 3, 2), material)}
      scale={[1, 1, 1]}
    />
  );
}
