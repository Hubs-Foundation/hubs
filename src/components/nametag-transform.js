AFRAME.registerComponent("nametag-transform", {
  schema: {
    follow: {type: "string"}
  },
  init: function() {
    this.vector = new THREE.Vector3();

    // TODO this traversal kinda feels like a hack. Should probably change networked-aframe to support it properly.
    // traverse up to the networked player rig and find the networked head.
    var head = this._findParent(this.el, '[networked]').parentNode.querySelector(this.data.follow);
    // traverse up to the head's networked parent and get its object3D
    this.followObj = this._findParent(head, '[networked]').object3D;
  },
  _findParent: function (el, selector) {
    var parent = el.parentNode;
    while(parent && !parent.matches(selector)) {
      parent = parent.parentNode;
    }
    return parent;
  },
  tick: function(t) {
    var target = this.el.sceneEl.camera;
    var object3D = this.el.object3D;

    var followPosition = this.followObj.position;
    object3D.position.x = followPosition.x;
    object3D.position.z = followPosition.z;

    if (target) {
      this.vector.setFromMatrixPosition(target.matrixWorld);
      if (object3D.parent) {
        object3D.parent.updateMatrixWorld();
        object3D.parent.worldToLocal(this.vector);
      }
      return object3D.lookAt(this.vector);
    }
  }
});
