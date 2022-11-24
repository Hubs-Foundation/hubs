export enum WaypointFlags {
  canBeSpawnPoint = 1 << 0,
  canBeOccupied = 1 << 1,
  canBeClicked = 1 << 2,
  willDisableMotion = 1 << 3,
  willDisableTeleporting = 1 << 4,
  willMaintainInitialOrientation = 1 << 5,
  snapToNavMesh = 1 << 6
}
