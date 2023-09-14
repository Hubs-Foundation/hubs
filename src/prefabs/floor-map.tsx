/** @jsx createElementEntity */
import { COLLISION_LAYERS } from "../constants";
import { createElementEntity, renderAsEntity, Ref, createRef, EntityDef } from "../utils/jsx-entity";
import nametagSrc from "../assets/images/floorPlan_prototype.png";
import spotSrc from "../assets/images/red_spot.png";
import { textureLoader } from "../utils/media-utils";
import { HubsWorld } from "../app";
import { Vector3 } from "three";
import { ProjectionMode } from "../utils/projection-mode";
import { AlphaMode } from "../utils/create-image-mesh";

const panelTexture = textureLoader.load(nametagSrc);
const spotTexture = textureLoader.load(spotSrc);

interface FloorMapPanelParamaters {
  panelRef: Ref;
  pointRef: Ref;
}

export function FloorMapPanel(position: Vector3, pointPos: Vector3) {
  const panelRef = createRef();
  const pointRef = createRef();
  return (
    <entity
      name={"floor-map"}
      // slice9={{ size: [2, 1.125], insets: [64, 66, 64, 66], texture: panelTexture }}
      image={{
        texture: panelTexture,
        ratio: 1,
        projection: ProjectionMode.FLAT,
        alphaMode: AlphaMode.Opaque,
        cacheKey: ""
      }}
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
    >
      <entity
        name="point"
        position={[pointPos.x / 50, pointPos.z / 50, 0.02]}
        scale={[0.05, 0.05, 0.05]}
        ref={pointRef}
        image={{
          texture: spotTexture,
          ratio: 1,
          projection: ProjectionMode.FLAT,
          alphaMode: AlphaMode.Blend,
          cacheKey: ""
        }}
      ></entity>
    </entity>
  );
}

export function addFloorMap(world: HubsWorld, position: Vector3, pointPos: Vector3) {
  const eid = renderAsEntity(world, FloorMapPanel(position, pointPos));
  const obj = world.eid2obj.get(eid)!;
  window.APP.scene!.object3D.add(obj);
  return eid;
}
