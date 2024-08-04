import { defineQuery, entityExists, exitQuery, hasComponent } from "bitecs";
import { Matrix4, Mesh, MeshStandardMaterial, Object3D } from "three";
import { HubsWorld } from "../app";
import {
  HoveredRemoteLeft,
  HoveredRemoteRight,
  Interacted,
  Networked,
  NetworkedWaypoint,
  Owned,
  SceneRoot,
  Waypoint,
  WaypointPreview
} from "../bit-components";
import { CharacterControllerSystem } from "../systems/character-controller-system";
import { sleep } from "../utils/async-utils";
import { anyEntityWith, findAncestorWithComponent } from "../utils/bit-utils";
import { coroutine } from "../utils/coroutine";
import { EntityID } from "../utils/networking-types";
import { takeOwnership } from "../utils/take-ownership";
import { takeSoftOwnership } from "../utils/take-soft-ownership";
import { setMatrixWorld } from "../utils/three-utils";

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

function occupyWaypoint(world: HubsWorld, eid: EntityID) {
  if (!hasComponent(world, Owned, eid)) {
    throw new Error("Tried to occupy waypoint before owning it.");
  }
  NetworkedWaypoint.occupied[eid] = 1;
  myOccupiedWaypoint = eid;
}

function nonOccupiableSpawnPoints(world: HubsWorld) {
  return waypointQuery(world).filter(eid => {
    const canBeSpawnPoint = Waypoint.flags[eid] & WaypointFlags.canBeSpawnPoint;
    const canBeOccupied = Waypoint.flags[eid] & WaypointFlags.canBeOccupied;
    return canBeSpawnPoint && !canBeOccupied && findAncestorWithComponent(world, SceneRoot, eid);
  });
}

function occupiableSpawnPoints(world: HubsWorld) {
  return waypointQuery(world).filter(eid => {
    const canBeSpawnPoint = Waypoint.flags[eid] & WaypointFlags.canBeSpawnPoint;
    const canBeOccupied = Waypoint.flags[eid] & WaypointFlags.canBeOccupied;
    return (
      canBeSpawnPoint &&
      canBeOccupied &&
      !NetworkedWaypoint.occupied[eid] &&
      findAncestorWithComponent(world, SceneRoot, eid)
    );
  });
}

function* tryOccupyAndSpawn(world: HubsWorld, characterController: CharacterControllerSystem, spawnPoint: EntityID) {
  moveToWaypoint(world, spawnPoint, characterController, true);
  takeSoftOwnership(world, spawnPoint);
  occupyWaypoint(world, spawnPoint);
  // TODO: We could check if we lost ownership, and not wait as long "lostOwnershipWithTimeout"
  yield sleep(2000);
  if (entityExists(world, spawnPoint) && hasComponent(world, Owned, spawnPoint)) {
    takeOwnership(world, spawnPoint);
    return true;
  } else {
    return false;
  }
}

function* trySpawnIntoOccupiable(world: HubsWorld, characterController: CharacterControllerSystem) {
  for (let i = 0; i < 3; i++) {
    const spawnPoints = occupiableSpawnPoints(world);
    if (!spawnPoints.length) return false;

    const waypoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    if (yield* tryOccupyAndSpawn(world, characterController, waypoint)) {
      initialSpawnHappened = true;
      return true;
    }
  }

  return false;
}

function* moveToSpawnPointJob(world: HubsWorld, characterController: CharacterControllerSystem) {
  if (yield* trySpawnIntoOccupiable(world, characterController)) return;

  const spawnPoints = nonOccupiableSpawnPoints(world);
  if (spawnPoints.length) {
    const waypoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    moveToWaypoint(world, waypoint, characterController, true);
  } else {
    console.warn("Could not find any available spawn points, spawning at the origin.");
    characterController.enqueueWaypointTravelTo(new Matrix4().identity(), true, {
      willDisableMotion: false,
      willDisableTeleporting: false,
      snapToNavMesh: true,
      willMaintainInitialOrientation: false
    });
  }
  initialSpawnHappened = true;
}

let spawnJob: Coroutine | null = null;
export function moveToSpawnPoint(world: HubsWorld, characterController: CharacterControllerSystem) {
  spawnJob = coroutine(moveToSpawnPointJob(world, characterController));
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

const hoveredLeftWaypointQuery = defineQuery([Waypoint, HoveredRemoteLeft]);
const hoveredRightWaypointQuery = defineQuery([Waypoint, HoveredRemoteRight]);

const exitedOwnedQuery = exitQuery(defineQuery([Owned]));

// Todo: Find a better place for this system state variables, maybe in a scene component?
let preview: Object3D | null;
let initialSpawnHappened: boolean = false;
let previousWaypointHash: string | null = null;
export function waypointSystem(
  world: HubsWorld,
  characterController: CharacterControllerSystem,
  sceneIsFrozen: boolean
) {
  if (exitedOwnedQuery(world).includes(myOccupiedWaypoint)) {
    myOccupiedWaypoint = 0;
  }

  // When a scene is opened with a named waypoint we have to make sure that the scene default waypoint
  // doesn't override it and that we correctly spawn in the named waypoint from the url.
  // We use initialSpawnHappened to check if the player has already spawned in the default spawn point.
  // In that case initialSpawnHappened will be set to true and then we can get the hash named point and move to that one,
  // this way we don't override the player position with the default spawn point position.
  // We use previousWaypointHash to make sure that if we have already moved to a named waypoint we don't move again.
  // See https://github.com/Hubs-Foundation/hubs/issues/2833 and https://github.com/Hubs-Foundation/hubs/pull/2837/files#r468103137
  const hashUpdated = window.location.hash !== "" && previousWaypointHash !== window.location.hash;
  const waypointName = window.location.hash.replace("#", "");
  if (hashUpdated && initialSpawnHappened) {
    waypointQuery(world).forEach(eid => {
      const waypointObj = world.eid2obj.get(eid)!;
      if (waypointObj.name === waypointName) {
        moveToWaypoint(world, eid, characterController, previousWaypointHash === null);
        window.history.replaceState(null, "", window.location.href.split("#")[0]); // Reset so you can re-activate the same waypoint
        previousWaypointHash = window.location.hash;
      }
    });
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
          // We don't expect to get here:
          // We should be able to interact with an occupied waypoint...
          console.error("Interacted with an occupied waypoint. Doing nothing.");
        } else {
          takeOwnership(world, eid);
          occupyWaypoint(world, eid);
          moveToWaypoint(world, eid, characterController, false);
        }
      } else {
        moveToWaypoint(world, eid, characterController, false);
      }
    }

    const obj = world.eid2obj.get(eid)!;
    obj.visible = sceneIsFrozen;
    const isOccupied = hasComponent(world, NetworkedWaypoint, eid) && NetworkedWaypoint.occupied[eid];
    if (Waypoint.flags[eid] & WaypointFlags.canBeOccupied && obj.children.length) {
      ((obj.children[0] as Mesh).material as MeshStandardMaterial).color.setHex(isOccupied ? 0xff00aa : 0xffffff);
    }
  });

  const hovered = hoveredRightWaypointQuery(world) || hoveredLeftWaypointQuery(world);
  if (!preview) {
    preview = world.eid2obj.get(anyEntityWith(world, WaypointPreview)!)!;
  }
  preview.visible = !!hovered.length;
  if (hovered.length) {
    const eid = hovered[0];
    const obj = world.eid2obj.get(eid)!;
    obj.updateMatrices();
    setMatrixWorld(preview, obj.matrixWorld);
  }

  if (spawnJob && spawnJob().done) {
    spawnJob = null;
  }
}

// TODO: Implement named waypoints and location.hash navigation

// TODO: Don't use any. Write the correct type
type Coroutine = () => any;
