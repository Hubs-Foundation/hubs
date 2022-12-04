import { defineQuery, exitQuery, hasComponent } from "bitecs";
import { Matrix4, Mesh, MeshStandardMaterial } from "three";
import { HubsWorld } from "../app";
import { Interacted, NetworkedWaypoint, Owned, SceneRoot, Waypoint } from "../bit-components";
import { CharacterControllerSystem } from "../systems/character-controller-system";
import { findAncestorWithComponent } from "../utils/bit-utils";
import { takeOwnership } from "../utils/take-ownership";

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

let myOccupiedWaypoint = 0;
export function releaseOccupiedWaypoint() {
  if (myOccupiedWaypoint) {
    NetworkedWaypoint.occupied[myOccupiedWaypoint] = 0;
    myOccupiedWaypoint = 0;
  }
}

export function moveToSpawnPoint(world: HubsWorld, characterController: CharacterControllerSystem) {
  const spawnPoints = waypointQuery(world).filter(eid => {
    return Waypoint.flags[eid] & WaypointFlags.canBeSpawnPoint && findAncestorWithComponent(world, SceneRoot, eid);
  });

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

const waypointExitQuery = exitQuery(waypointQuery);
export function waypointSystem(
  world: HubsWorld,
  characterController: CharacterControllerSystem,
  sceneIsFrozen: boolean
) {
  if (waypointExitQuery(world).includes(myOccupiedWaypoint)) {
    myOccupiedWaypoint = 0;
  }

  waypointQuery(world).forEach(eid => {
    if (hasComponent(world, NetworkedWaypoint, eid) && hasComponent(world, Owned, eid) && eid !== myOccupiedWaypoint) {
      // Inherited this waypoint, clear its occupied state
      if (NetworkedWaypoint.occupied[eid]) {
        NetworkedWaypoint.occupied[eid] = 0;
      }
    }

    if (hasComponent(world, Interacted, eid)) {
      if (hasComponent(world, NetworkedWaypoint, eid)) {
        if (NetworkedWaypoint.occupied[eid]) {
          console.warn("Can't travel to occupied waypoint...");
        } else {
          takeOwnership(world, eid);
          NetworkedWaypoint.occupied[eid] = 1;
          myOccupiedWaypoint = eid;
          moveToWaypoint(world, eid, characterController, false);
        }
      } else {
        moveToWaypoint(world, eid, characterController, false);
      }
    }

    const obj = world.eid2obj.get(eid)!;
    obj.visible = true || sceneIsFrozen;
    const isOccupied = hasComponent(world, NetworkedWaypoint, eid) && NetworkedWaypoint.occupied[eid];
    if (Waypoint.flags[eid] & WaypointFlags.canBeOccupied && obj.children.length) {
      ((obj.children[0] as Mesh).material as MeshStandardMaterial).color.setHex(isOccupied ? 0xff00aa : 0xffffff);
    }
  });
}

// TODO: Implement named waypoints and location.hash navigation
