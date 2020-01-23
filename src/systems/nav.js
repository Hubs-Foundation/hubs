import { waitForDOMContentLoaded } from "../utils/async-utils";
const { Pathfinding } = require("three-pathfinding");

AFRAME.registerSystem("nav", {
  init: function() {
    this.pathfinder = new Pathfinding();
    this.mesh = null;
    this.environmentScene = null;
    this.mostRecentSceneSrc = null;
    waitForDOMContentLoaded().then(() => {
      this.environmentScene = document.querySelector("#environment-scene");
      this.environmentScene.addEventListener("model-loaded", e => {
        const currentSceneSrc = e.detail.src;
        const shouldClearNavMesh = this.mostRecentSceneSrc && currentSceneSrc !== this.mostRecentSceneSrc;
        if (shouldClearNavMesh) {
          // If the environment changes but a new nav mesh has not been set,
          // it means the new scene does not have a nav mesh and we need to
          // clear the one left over from the previous scene, if it exists.
          this.clearOldNavMesh();
        }
        this.mostRecentSceneSrc = currentSceneSrc;
      });
    });
  },

  loadMesh: function(mesh, zone) {
    this.el.object3D.updateMatrixWorld();

    if (this.mesh && this.mesh.geometry && this.mesh.geometry.dispose) {
      this.mesh.geometry.dispose();
    }

    this.mesh = mesh;
    const geometry = new THREE.Geometry().fromBufferGeometry(mesh.geometry);
    geometry.applyMatrix(mesh.matrixWorld);
    this.pathfinder.setZoneData(zone, Pathfinding.createZone(geometry));
    this.el.sceneEl.emit("nav-mesh-loaded");

    if (this.environmentScene) {
      this.mostRecentSceneSrc = this.environmentScene.children[0].components["gltf-model-plus"].data.src;
    }
  },

  clearOldNavMesh() {
    if (this.mesh && this.mesh.geometry && this.mesh.geometry.dispose) {
      this.mesh.geometry.dispose();
    }
    this.mesh = null;
    this.pathfinder.zones = {}; //TODO: Might be better to add a method to three-pathfinding to clear all zones
  }
});
