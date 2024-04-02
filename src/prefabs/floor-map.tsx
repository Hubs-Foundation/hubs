/** @jsx createElementEntity */
import { COLLISION_LAYERS } from "../constants";
import { createElementEntity, renderAsEntity, Ref, createRef, EntityDef } from "../utils/jsx-entity";
import unavailableMapSrc from "../assets/images/unavailable_map.png";
import spotSrc from "../assets/images/pointer.png";
import { textureLoader } from "../utils/media-utils";
import { HubsWorld } from "../app";
import { Object3D, Vector3 } from "three";
import { ProjectionMode } from "../utils/projection-mode";
import { AlphaMode } from "../utils/create-image-mesh";

const spotTexture = textureLoader.load(spotSrc);

export function FloorMapPanel(ratio: number, imageSrc: string) {
  const panelRef = createRef();
  const pointRef = createRef();
  const panelTexture = !!imageSrc ? textureLoader.load(imageSrc) : textureLoader.load(unavailableMapSrc);
  return (
    <entity followFov>
      <entity
        name={"floor-map"}
        image={{
          texture: panelTexture,
          ratio: ratio,
          projection: ProjectionMode.FLAT,
          alphaMode: AlphaMode.Blend,
          cacheKey: ""
        }}
        floorMap={{ planeRef: panelRef, pointRef: pointRef }}
        cursorRaycastable
        remoteHoverTarget
        handCollisionTarget
        offersRemoteConstraint
        offersHandConstraint
        makeKinematicOnRelease
        holdable
        floatyObject
        position={[0, 0, 0.7]}
        lookatuser
        rigidbody={{ collisionGroup: COLLISION_LAYERS.INTERACTABLES, collisionMask: COLLISION_LAYERS.HANDS }}
        physicsShape={{ halfExtents: [0.22, 0.14, 0.1] }}
      >
        <entity
          name="point"
          scale={[0.02, 0.02, 0.02]}
          ref={pointRef}
          image={{
            texture: spotTexture,
            ratio: 1,
            projection: ProjectionMode.FLAT,
            alphaMode: AlphaMode.Mask,
            cacheKey: ""
          }}
        />
      </entity>
    </entity>
  );
}

export function addFloorMap(world: HubsWorld, ratio: number, image: string): Vector3 {
  const eid = renderAsEntity(world, FloorMapPanel(ratio, image));
  const obj = world.eid2obj.get(eid)!;
  var boundingBox = new THREE.Box3();
  boundingBox.setFromObject(obj);
  var boundingBoxSize = new THREE.Vector3();
  boundingBox.getSize(boundingBoxSize);
  APP.world.scene.add(obj);
  return boundingBoxSize;
}
