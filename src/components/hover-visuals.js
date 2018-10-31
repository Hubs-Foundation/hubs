/**
 * Listens for hoverable state changes and applies a visual effect to an entity
 * @namespace interactables
 * @component hover-visuals
 */
AFRAME.registerComponent("hover-visuals", {
  init: function() {
    // uniforms are set from the component responsible for loading the mesh.
    this.uniforms = null;
    this.interactorTransform = [];
  },
  remove() {
    this.interactorTransform = null;
  },
  tick(time) {
    if (!this.uniforms) return;

    this.el.object3D.matrixWorld.toArray(this.interactorTransform);

    for (const uniform of this.uniforms) {
      uniform.hubs_HighlightInteractorOne.value = !!this.el.components["super-hands"].state.has("hover-start");
      uniform.hubs_InteractorOneTransform.value = this.interactorTransform;
      uniform.hubs_Time.value = time;
    }
  }
});
