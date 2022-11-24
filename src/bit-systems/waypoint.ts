import { defineQuery, hasComponent } from "bitecs";
import { Matrix4 } from "three";
import { HubsWorld } from "../app";
import { Interacted, SceneRoot, Waypoint } from "../bit-components";
import { CharacterControllerSystem } from "../systems/character-controller-system";
import { findAncestorWithComponent } from "../utils/bit-utils";

export enum WaypointFlags {
  canBeSpawnPoint = 1 << 0,
  canBeOccupied = 1 << 1,
  canBeClicked = 1 << 2,
  willDisableMotion = 1 << 3,
  willDisableTeleporting = 1 << 4,
  willMaintainInitialOrientation = 1 << 5,
  snapToNavMesh = 1 << 6
}

const waypointQuery = defineQuery([Waypoint]);
export function moveToSpawnPoint(world: HubsWorld, characterController: CharacterControllerSystem) {
  const spawnPoints = waypointQuery(world).filter(eid => {
    return Waypoint.flags[eid] & WaypointFlags.canBeSpawnPoint && findAncestorWithComponent(world, SceneRoot, eid);
  });
  // TODO: Remember about named waypoints and location.hash navigation

  if (spawnPoints.length === 0) {
    characterController.enqueueWaypointTravelTo(new Matrix4().identity(), true, {
      willDisableMotion: false,
      willDisableTeleporting: false,
      snapToNavMesh: true,
      willMaintainInitialOrientation: false
    });
  } else {
    const randomWaypoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    moveToWaypoint(world, randomWaypoint, characterController, true);
  }
}

function moveToWaypoint(
  world: HubsWorld,
  eid: number,
  characterController: CharacterControllerSystem,
  instant: boolean
) {
  const obj = world.eid2obj.get(eid)!;
  obj.updateMatrices();

  characterController.enqueueWaypointTravelTo(
    obj.matrixWorld,
    instant || !window.APP.store.state.preferences.animateWaypointTransitions, // TODO: Use store-instance
    {
      willDisableMotion: !!(Waypoint.flags[eid] & WaypointFlags.willDisableMotion),
      willDisableTeleporting: !!(Waypoint.flags[eid] & WaypointFlags.willDisableTeleporting),
      snapToNavMesh: !!(Waypoint.flags[eid] & WaypointFlags.snapToNavMesh),
      willMaintainInitialOrientation: !!(Waypoint.flags[eid] & WaypointFlags.willMaintainInitialOrientation)
    }
  );
}

export function waypointSystem(
  world: HubsWorld,
  characterController: CharacterControllerSystem,
  sceneIsFrozen: boolean
) {
  waypointQuery(world).forEach(eid => {
    if (hasComponent(world, Interacted, eid)) {
      moveToWaypoint(world, eid, characterController, false);
    }

    world.eid2obj.get(eid)!.visible = sceneIsFrozen;
  });
}
