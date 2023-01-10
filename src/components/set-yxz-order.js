AFRAME.registerComponent("set-yxz-order", {
  init: function () {
    this.el.object3D.rotation.order = "YXZ";
  }
});
