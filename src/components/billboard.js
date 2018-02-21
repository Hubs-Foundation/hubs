AFRAME.registerComponent("billboard", {
  init: function() {
    this.vector = new THREE.Vector3();
  },
  tick: function(t) {
    const target = this.el.sceneEl.camera;
    const object3D = this.el.object3D;

    if (target) {
      this.vector.setFromMatrixPosition(target.matrixWorld);

      if (object3D.parent) {
        object3D.parent.worldToLocal(this.vector);
      }

      return object3D.lookAt(this.vector);
    }
  }
});
