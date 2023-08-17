/** @jsx createElementEntity */
import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import spawnPointSrc from "../assets/images/sprites/notice/spawn-point.png";
import { Networked, NetworkedWaypoint, Waypoint } from "../bit-components";
import { WaypointFlags } from "../bit-systems/waypoint";
import { AlphaMode } from "../utils/create-image-mesh";
import { createElementEntity, createRef, renderAsEntity } from "../utils/jsx-entity";
import { loadTexture, loadTextureFromCache } from "../utils/load-texture";
import { preload } from "../utils/preload";
import { ProjectionMode } from "../utils/projection-mode";

preload(loadTexture(spawnPointSrc, 1, "image/png"));

export interface WaypointParams {
  canBeSpawnPoint: boolean;
  canBeOccupied: boolean;
  canBeClicked: boolean;
  willDisableMotion: boolean;
  willDisableTeleporting: boolean;
  willMaintainInitialOrientation: boolean;
  snapToNavMesh: boolean;
}

/**
 * @deprecated Use inflateWaypoint with `canBeSpawnPoint instead`
 */
export function inflateSpawnpoint(world: HubsWorld, eid: number, _props: {}) {
  console.warn(
    "The `spawn-point` component is deprecated. Use the `waypoint` component with `canBeSpawnPoint` instead."
  );
  return inflateWaypoint(world, eid, {
    canBeSpawnPoint: true,
    canBeOccupied: false,
    canBeClicked: false,
    willDisableMotion: false,
    willDisableTeleporting: false,
    willMaintainInitialOrientation: false,
    snapToNavMesh: false
  });
}

export function inflateWaypoint(world: HubsWorld, eid: number, props: WaypointParams) {
  addComponent(world, Waypoint, eid);
  let flags = 0;
  if (props.canBeSpawnPoint) flags |= WaypointFlags.canBeSpawnPoint;
  if (props.canBeOccupied) flags |= WaypointFlags.canBeOccupied;
  if (props.canBeClicked) flags |= WaypointFlags.canBeClicked;
  if (props.willDisableMotion) flags |= WaypointFlags.willDisableMotion;
  if (props.willDisableTeleporting) flags |= WaypointFlags.willDisableTeleporting;
  if (props.willMaintainInitialOrientation) flags |= WaypointFlags.willMaintainInitialOrientation;
  if (props.snapToNavMesh) flags |= WaypointFlags.snapToNavMesh;
  Waypoint.flags[eid] = flags;

  if (Waypoint.flags[eid] & WaypointFlags.canBeOccupied) {
    addComponent(world, Networked, eid);
    addComponent(world, NetworkedWaypoint, eid);
  }

  if (props.canBeClicked) {
    const { texture, cacheKey } = loadTextureFromCache(spawnPointSrc, 1);
    renderAsEntity(
      world,
      <entity name="Waypoint" ref={createRef(eid)} cursorRaycastable remoteHoverTarget singleActionButton>
        <entity
          name="Waypoint Icon"
          position={[0, 1.6, -0.15]}
          scale={[0.5, 0.5, 0.5]}
          image={{
            texture,
            ratio: 1,
            projection: ProjectionMode.FLAT,
            alphaMode: AlphaMode.BLEND,
            cacheKey
          }}
        ></entity>
      </entity>
    );
  }
}
