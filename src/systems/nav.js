const { Pathfinding } = require("three-pathfinding");

AFRAME.registerSystem("nav", {
  init: function() {
    this.pathfinder = new Pathfinding();
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
  }
});
