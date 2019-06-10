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
    this.hideVisualEffectOnElement = this.hideVisualEffectOnElement.bind(this);
    this.hadLeftVisualLastFrame = false;
    this.hadRightVisualLastFrame = false;
    this.uniforms = null;
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

  hideVisualEffectOnElement(el) {
    const isFrozen = this.el.sceneEl.is("frozen");
    const isPinned = el.components.pinnable && el.components.pinnable.data.pinned;
    const isSpawner = !!el.components["super-spawner"];

    return !isSpawner && isPinned && !isFrozen;
  },

  handleLeftVisuals: function() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const interactingElement = interaction.state.leftHand.held || interaction.state.leftHand.hovered;
    const hideVisual = !interactingElement || this.hideVisualEffectOnElement(interactingElement);

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
    const hideVisual = !interactingElement || this.hideVisualEffectOnElement(interactingElement);

    // Last frame, we didn't have a visual so no need to update uniforms.
    if (hideVisual && !this.hadRightVisualLastFrame) return;
    this.hadRightVisualLastFrame = !hideVisual;

    const elements = this.el.object3D.matrixWorld.elements;

    for (let i = 0, l = this.uniforms.length; i < l; i++) {
      const uniform = this.uniforms[i];
      uniform.hubs_HighlightInteractorTwo.value = !hideVisual;
      uniform.hubs_InteractorTwoPos.value[0] = elements[12];
      uniform.hubs_InteractorTwoPos.value[1] = elements[13];
      uniform.hubs_InteractorTwoPos.value[2] = elements[14];
    }
  }
});
