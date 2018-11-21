AFRAME.registerComponent("teleport-controls-matrix-auto-update", {
  init: function() {
    this.teleportControls = this.el.components["teleport-controls"];
    this._updateMatrixNeedsUpdate = this._updateMatrixNeedsUpdate.bind(this);
  },

  play: function() {
    this.el.sceneEl.addEventListener("teleported", this._updateMatrixNeedsUpdate);
  },

  pause: function() {
    this.el.sceneEl.removeEventListener("teleported", this._updateMatrixNeedsUpdate);
  },

  tick: function() {
    if (this.lastHitEntity !== this.teleportControls.hitEntity) {
      this.teleportControls.hitEntity.object3D.traverse(o => (o.matrixAutoUpdate = true));
      this.lastHitEntity = this.teleportControls.hitEntity;
    }
  },

  _updateMatrixNeedsUpdate: function() {
    this.teleportControls.data.cameraRig.matrixNeedsUpdate = true;
  }
});
