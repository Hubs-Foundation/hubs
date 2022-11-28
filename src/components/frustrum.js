/**
 * Frustrum-based object visibilty
 * @component frustrum
 */
AFRAME.registerComponent("frustrum", {
  schema: {
    culled: { type: "boolean", default: true }
  },

  update: function () {
    this.updateDescendants(this.data.culled);
  },

  remove: function () {
    this.updateDescendants(true);
  },

  updateDescendants: function (culled) {
    this.el.object3D.traverse(function (node) {
      if (!(node instanceof THREE.Mesh)) {
        return;
      }
      node.frustumCulled = culled;
    });
  }
});
