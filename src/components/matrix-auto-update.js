AFRAME.registerComponent("matrix-auto-update", {
  schema: {
    target: { type: "string" }
  },

  init: function() {
    this._updateMatrixAutoUpdate = this._updateMatrixAutoUpdate.bind(this);
    this._updateMatrixAutoUpdate();
  },

  play: function() {
    this.el.sceneEl.addEventListener("object3dset", this._updateMatrixAutoUpdate);
  },

  pause: function() {
    this.el.sceneEl.removeEventListener("object3dset", this._updateMatrixAutoUpdate);
  },

  _updateMatrixAutoUpdate: function() {
    if (this.data.target) {
      this.el.getObject3D(this.data.target).matrixAutoUpdate = true;
    } else {
      this.el.object3D.matrixAutoUpdate = true;
    }
  }
});
