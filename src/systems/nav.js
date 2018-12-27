const { Pathfinding } = require("three-pathfinding");

AFRAME.registerSystem("nav", {
  init: function() {
    this.pathfinder = new Pathfinding();
  },

  loadMesh: function(mesh, zone) {
    this.el.object3D.updateMatrixWorld();
    const geometry = new THREE.Geometry().fromBufferGeometry(mesh.geometry);
    geometry.applyMatrix(mesh.matrixWorld);
    this.pathfinder.setZoneData(zone, Pathfinding.createZone(geometry));
  }
});
