/** @jsx createElementEntity */
import { COLLISION_LAYERS } from "../constants";
import { createElementEntity, renderAsEntity, Ref, createRef, EntityDef } from "../utils/jsx-entity";
// import nametagSrc from "../assets/images/floorPlan_prototype.png";
import nametagSrc from "../assets/images/demo_map.png";
import spotSrc from "../assets/images/red_spot.png";
import { textureLoader } from "../utils/media-utils";
import { HubsWorld } from "../app";
import { Object3D, Vector3 } from "three";
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
  const scalar = 1 / 50;
  return (
    <entity
      name={"floor-map"}
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
      // holdable
      floatyObject
      rigidbody={{ collisionGroup: COLLISION_LAYERS.INTERACTABLES, collisionMask: COLLISION_LAYERS.HANDS }}
      physicsShape={{ halfExtents: [0.22, 0.14, 0.1] }}
    >
      <entity
        name="point"
        position={[pointPos.x * scalar, pointPos.z * scalar, 0.02]}
        scale={[0.02, 0.02, 0.02]}
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

export function addFloorMap(world: HubsWorld, position: Vector3, pointPos: Vector3, userPOV: Object3D) {
  const eid = renderAsEntity(world, FloorMapPanel(position, pointPos));
  const obj = world.eid2obj.get(eid)!;
  userPOV.add(obj);
  return eid;
}
