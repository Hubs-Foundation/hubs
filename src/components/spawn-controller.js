import { getLastWorldPosition } from "../utils/three-utils";
import { waitForDOMContentLoaded } from "../utils/async-utils";

/**
 * Used on a avatar-rig to move the avatar to a random spawn point on entry.
 * @namespace avatar
 * @component spawn-controller
 */
AFRAME.registerComponent("spawn-controller", {
  schema: {
    target: { type: "selector" },
    camera: { type: "selector", default: "#avatar-pov-node" },
    playerHeight: { default: 1.6 },
    loadedEvent: { type: "string" }
  },
  init() {
    this.moveToSpawnPoint = this.moveToSpawnPoint.bind(this);

    waitForDOMContentLoaded().then(() => {
      this.data.target.addEventListener(this.data.loadedEvent, this.moveToSpawnPoint);
    });
  },
  moveToSpawnPoint() {
    const spawnPoints = document.querySelectorAll("[spawn-point]");

    if (spawnPoints.length === 0) {
      // Keep default position
      return;
    }

    const camera = this.data.camera;
    const spawnPointIndex = Math.round((spawnPoints.length - 1) * Math.random());
    const spawnPoint = spawnPoints[spawnPointIndex];

    getLastWorldPosition(spawnPoint.object3D, this.el.object3D.position);
    this.el.object3D.rotation.copy(spawnPoint.object3D.rotation);

    if (this.el.sceneEl.is("vr-mode")) {
      // Rotate the avatar rig such that the vr-camera faces forward.
      this.el.object3D.rotation.y -= this.data.camera.object3D.rotation.y;
    } else {
      // Reset the camera transform in 2D mode.
      camera.object3D.position.set(0, this.data.playerHeight, 0);
      camera.object3D.rotation.set(0, 0, 0);
      camera.object3D.matrixNeedsUpdate = true;
    }

    // Camera faces -Z direction. Flip rotation on Y axis to face the correct direction.
    this.el.object3D.rotation.y += Math.PI;
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
