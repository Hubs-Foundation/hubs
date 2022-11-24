import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Waypoint } from "../bit-components";
import { WaypointFlags } from "../bit-systems/waypoint";

export interface WaypointParams {
  canBeSpawnPoint: boolean;
  canBeOccupied: boolean;
  canBeClicked: boolean;
  willDisableMotion: boolean;
  willDisableTeleporting: boolean;
  willMaintainInitialOrientation: boolean;
  snapToNavMesh: boolean;
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

  console.log("inflated a waypoint!", props, flags, eid);
}
