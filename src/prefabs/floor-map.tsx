/** @jsx createElementEntity */
import { COLLISION_LAYERS } from "../constants";
import { createElementEntity, renderAsEntity, Ref, createRef, EntityDef } from "../utils/jsx-entity";
import unavailableMapSrc from "../assets/images/unavailable_map.png";
import spotSrc from "../assets/images/pointer_head.png";
import lobbySrc from "../assets/images/en_map_tradeshows.png";
import { textureLoader } from "../utils/media-utils";
import { HubsWorld } from "../app";
import { Object3D, Vector3 } from "three";
import { ProjectionMode } from "../utils/projection-mode";
import { AlphaMode } from "../utils/create-image-mesh";
import { degToRad } from "three/src/math/MathUtils";

const spotTexture = textureLoader.load(spotSrc);
const lobbydemoText = textureLoader.load(lobbySrc);

export function FloorMapPanel(imageRatio: number, mapImage: string, scale: number) {
  const panelRef = createRef();
  const pointRef = createRef();
  return (
    <entity followFov={{ offset: [0, 0, -2] }} scale={[scale, scale, scale]}>
      <entity
        name={"floor-map"}
        image={{
          texture: textureLoader.load(mapImage),
          ratio: imageRatio,
          projection: ProjectionMode.FLAT,
          alphaMode: AlphaMode.Blend,
          cacheKey: ""
        }}
        floorMap={{ planeRef: panelRef, pointRef: pointRef }}
        ref={panelRef}
        remoteHoverTarget
        handCollisionTarget
        offersRemoteConstraint
        offersHandConstraint
        makeKinematicOnRelease
        holdable
        floatyObject
        rigidbody={{ collisionGroup: COLLISION_LAYERS.INTERACTABLES, collisionMask: COLLISION_LAYERS.HANDS }}
        // physicsShape={{ halfExtents: [0.22, 0.14, 0.1] }}
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
          position={[0, 0, 0.1]}
        />
      </entity>
    </entity>
  );
}
