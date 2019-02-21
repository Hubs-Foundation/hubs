import { getLastWorldPosition } from "../utils/three-utils";

/**
 * Used on a player-rig to move the player to a random spawn point on entry.
 * @namespace avatar
 * @component spawn-controller
 */
AFRAME.registerComponent("spawn-controller", {
  schema: {
    target: { type: "selector" },
    loadedEvent: { type: "string" }
  },
  init() {
    this.moveToSpawnPoint = this.moveToSpawnPoint.bind(this);
    this.data.target.addEventListener(this.data.loadedEvent, this.moveToSpawnPoint);
  },
  moveToSpawnPoint() {
    const spawnPoints = document.querySelectorAll("[spawn-point]");

    if (spawnPoints.length === 0) {
      // Keep default position
      return;
    }

    const spawnPointIndex = Math.round((spawnPoints.length - 1) * Math.random());
    const spawnPoint = spawnPoints[spawnPointIndex];

    getLastWorldPosition(spawnPoint.object3D, this.el.object3D.position);

    this.el.object3D.rotation.copy(spawnPoint.object3D.rotation);
    this.el.object3D.matrixNeedsUpdate = true;
  }
});

/**
 * Marks an entity as a potential spawn point.
 * @namespace environment
 * @component spawn-point
 */
AFRAME.registerComponent("spawn-point", {
  init() {
    this.el.object3D.visible = false;
  }
});
