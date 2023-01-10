const { Pathfinding } = require("three-pathfinding");
import qsTruthy from "../utils/qs_truthy";

AFRAME.registerSystem("nav", {
  init: function () {
    this.pathfinder = new Pathfinding();
    this.mesh = null;
    this.el.addEventListener("reset_scene", this.removeNavMeshData.bind(this));
    this.el.addEventListener("leaving_loading_environment", this.removeNavMeshData.bind(this));
  },

  loadMesh: function (mesh, zone) {
    if (this.mesh) {
      console.error("tried to load multiple nav meshes");
      this.removeNavMeshData();
    }
    const geometry = mesh.geometry.clone();
    mesh.updateMatrices();
    geometry.applyMatrix4(mesh.matrixWorld);
    this.pathfinder.setZoneData(zone, Pathfinding.createZone(geometry));
    this.mesh = mesh;

    this.el.sceneEl.emit("nav-mesh-loaded");

    if (qsTruthy("debugNavmesh")) {
      this.helperMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ wireframe: true }));
      this.el.sceneEl.object3D.add(this.helperMesh);
    }
  },

  removeNavMeshData() {
    if (this.mesh && this.mesh.geometry && this.mesh.geometry.dispose) {
      // If it's using the debug view material, restore the original material so it can be disposed.
      if (this.mesh._hubs_audio_debug_prev_material) {
        this.mesh.material = this.mesh._hubs_audio_debug_prev_material;
        this.mesh._hubs_audio_debug_prev_material = null;
      }
    }
    if (this.helperMesh) {
      this.helperMesh.material?.dispose();
      this.helperMesh.geometry?.dispose();
      this.helperMesh.removeFromParent();
      this.helperMesh = null;
    }
    this.mesh = null;
    this.pathfinder.zones = {};
  }
});
