/**
 * Applies effects to a hoverer based on hover state.
 * @namespace interactables
 * @component hover-visuals
 */
AFRAME.registerComponent("hover-visuals", {
  schema: {
    hand: { type: "string" },
    controller: { type: "selector" }
  },
  init: function() {
    // uniforms are set from the component responsible for loading the mesh.
    this.uniforms = null;
    this.interactorTransform = [];
  },
  remove() {
    this.interactorTransform = null;
  },
  tick() {
    if (!this.uniforms) return;

    this.el.object3D.matrixWorld.toArray(this.interactorTransform);
    const hovering = this.data.controller.components["super-hands"].state.has("hover-start");

    for (const uniform of this.uniforms) {
      if (this.data.hand === "left") {
        uniform.hubs_HighlightInteractorOne.value = hovering;
        uniform.hubs_InteractorOneTransform.value = this.interactorTransform;
      } else {
        uniform.hubs_HighlightInteractorTwo.value = hovering;
        uniform.hubs_InteractorTwoTransform.value = this.interactorTransform;
      }
    }
  }
});
