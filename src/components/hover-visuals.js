/**
 * Applies effects to a hoverer based on hover state.
 * @namespace interactables
 * @component hover-visuals
 */
AFRAME.registerComponent("hover-visuals", {
  schema: {
    hand: { type: "string" }
  },
  init() {
    // uniforms are set from the component responsible for loading the mesh.
    this.uniforms = null;
  },
  remove() {
    this.uniforms = null;
  },
  tick() {
    if (!this.uniforms || !this.uniforms.size) return;

    const elements = this.el.object3D.matrixWorld.elements;
    const interaction = AFRAME.scenes[0].systems.interaction;

    for (const uniform of this.uniforms.values()) {
      if (this.data.hand === "left") {
        uniform.hubs_HighlightInteractorOne.value =
          !!interaction.state.leftHand.held || !!interaction.state.leftHand.hovered;
        uniform.hubs_InteractorOnePos.value[0] = elements[12];
        uniform.hubs_InteractorOnePos.value[1] = elements[13];
        uniform.hubs_InteractorOnePos.value[2] = elements[14];
      } else {
        uniform.hubs_HighlightInteractorTwo.value =
          !!interaction.state.rightHand.held || !!interaction.state.rightHand.hovered;
        uniform.hubs_InteractorTwoPos.value[0] = elements[12];
        uniform.hubs_InteractorTwoPos.value[1] = elements[13];
        uniform.hubs_InteractorTwoPos.value[2] = elements[14];
      }
    }
  }
});
