import { showHoverEffect } from "../utils/permissions-utils";

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
    this.handleLeftVisuals = this.handleLeftVisuals.bind(this);
    this.handleRightVisuals = this.handleRightVisuals.bind(this);
    this.hadLeftVisualLastFrame = false;
    this.hadRightVisualLastFrame = false;
    this.uniforms = null;
    this.sweepParams = [0, 1.0];
  },
  remove() {
    this.uniforms = null;
  },
  tick() {
    if (!this.uniforms || !this.uniforms.length) return;

    // Push down loops to assist JIT:
    if (this.data.hand === "left") {
      this.handleLeftVisuals();
    } else {
      this.handleRightVisuals();
    }
  },

  handleLeftVisuals: function() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const interactingElement = interaction.state.leftHand.held || interaction.state.leftHand.hovered;
    const hideVisual = !interactingElement || !showHoverEffect(interactingElement);

    // Last frame, we didn't have a visual so no need to update uniforms.
    if (hideVisual && !this.hadLeftVisualLastFrame) return;
    this.hadLeftVisualLastFrame = !hideVisual;

    const elements = this.el.object3D.matrixWorld.elements;

    for (let i = 0, l = this.uniforms.length; i < l; i++) {
      const uniform = this.uniforms[i];
      uniform.hubs_HighlightInteractorOne.value = !hideVisual;
      uniform.hubs_InteractorOnePos.value[0] = elements[12];
      uniform.hubs_InteractorOnePos.value[1] = elements[13];
      uniform.hubs_InteractorOnePos.value[2] = elements[14];
    }
  },

  handleRightVisuals: function() {
    const interaction = AFRAME.scenes[0].systems.interaction;

    const interactingElement = interaction.state.rightHand.held || interaction.state.rightHand.hovered;
    const hideVisual = !interactingElement || !showHoverEffect(interactingElement);

    // Last frame, we didn't have a visual so no need to update uniforms.
    if (hideVisual && !this.hadRightVisualLastFrame) return;
    this.hadRightVisualLastFrame = !hideVisual;

    const elements = this.el.object3D.matrixWorld.elements;

    for (let i = 0, l = this.uniforms.length; i < l; i++) {
      const uniform = this.uniforms[i];
      uniform.hubs_SweepParams.value = this.sweepParams;

      uniform.hubs_HighlightInteractorTwo.value = !hideVisual;
      uniform.hubs_InteractorTwoPos.value[0] = elements[12];
      uniform.hubs_InteractorTwoPos.value[1] = elements[13];
      uniform.hubs_InteractorTwoPos.value[2] = elements[14];
    }
  }
});
