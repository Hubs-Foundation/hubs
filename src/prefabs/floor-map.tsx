/** @jsx createElementEntity */
import { COLLISION_LAYERS } from "../constants";
import { createElementEntity, renderAsEntity, Ref, createRef, EntityDef } from "../utils/jsx-entity";
import nametagSrc from "../assets/hud/nametag.9.png";
import { textureLoader } from "../utils/media-utils";
import { HubsWorld } from "../app";
import { Vector3 } from "three";

const panelTexture = textureLoader.load(nametagSrc);

interface FloorMapPanelParamaters {
  panelRef: Ref;
  pointRef: Ref;
}

export function FloorMapPanel(position: Vector3) {
  const panelRef = createRef();
  const pointRef = createRef();
  return (
    <entity
      name={"floor-map"}
      slice9={{ size: [4, 2.25], insets: [64, 66, 64, 66], texture: panelTexture }}
      floorMap={{ planeRef: panelRef, pointRef: pointRef }}
      position={position.toArray()}
      cursorRaycastable
      remoteHoverTarget
      handCollisionTarget
      offersRemoteConstraint
      offersHandConstraint
      makeKinematicOnRelease
      holdable
      floatyObject
      rigidbody={{ collisionGroup: COLLISION_LAYERS.INTERACTABLES, collisionMask: COLLISION_LAYERS.HANDS }}
      physicsShape={{ halfExtents: [0.22, 0.14, 0.1] }}
      lookatuser
    ></entity>
  );
}

export function addFloorMap(world: HubsWorld, position: Vector3) {
  const eid = renderAsEntity(world, FloorMapPanel(position));
  const obj = world.eid2obj.get(eid)!;
  window.APP.scene!.object3D.add(obj);
  return eid;
}
