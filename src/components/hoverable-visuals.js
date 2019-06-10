const interactorOneTransform = [];
const interactorTwoTransform = [];

/**
 * Applies effects to a hoverable based on hover state.
 * @namespace interactables
 * @component hoverable-visuals
 */
AFRAME.registerComponent("hoverable-visuals", {
  schema: {
    enableSweepingEffect: { type: "boolean", default: true }
  },
  init() {
    // uniforms and boundingSphere are set from the component responsible for loading the mesh.
    this.uniforms = null;
    this.boundingSphere = new THREE.Sphere();

    this.sweepParams = [0, 0];
  },
  remove() {
    this.uniforms = null;
    this.boundingBox = null;
  },
  tick(time) {
    if (!this.uniforms || !this.uniforms.length) return;

    const isPinned = this.el.components.pinnable && this.el.components.pinnable.data.pinned;
    const isSpawner = !!this.el.components["super-spawner"];
    const isFrozen = this.el.sceneEl.is("frozen");
    const hideDueToPinning = !isSpawner && isPinned && !isFrozen;

    let interactorOne, interactorTwo;
    const interaction = AFRAME.scenes[0].systems.interaction;
    if (interaction.state.leftHand.hovered === this.el || interaction.state.leftHand.held === this.el) {
      interactorOne = interaction.options.leftHand.entity.object3D;
    }
    if (interaction.state.rightRemote.hovered === this.el || interaction.state.rightRemote.held === this.el) {
      interactorTwo = interaction.options.rightRemote.entity.object3D;
    }
    if (interaction.state.rightHand.hovered === this.el || interaction.state.rightHand.held === this.el) {
      interactorTwo = interaction.options.rightHand.entity.object3D;
    }

    if (interactorOne) {
      interactorOne.matrixWorld.toArray(interactorOneTransform);
    }
    if (interactorTwo) {
      interactorTwo.matrixWorld.toArray(interactorTwoTransform);
    }

    if (interactorOne || interactorTwo || isFrozen) {
      const worldY = this.el.object3D.matrixWorld.elements[13];
      const scaledRadius = this.el.object3D.scale.y * this.boundingSphere.radius;
      this.sweepParams[0] = worldY - scaledRadius;
      this.sweepParams[1] = worldY + scaledRadius;
    }

    for (let i = 0, l = this.uniforms.length; i < l; i++) {
      const uniform = this.uniforms[i];
      uniform.hubs_EnableSweepingEffect.value = this.data.enableSweepingEffect && !hideDueToPinning;
      uniform.hubs_IsFrozen.value = isFrozen;
      uniform.hubs_SweepParams.value = this.sweepParams;

      uniform.hubs_HighlightInteractorOne.value = !!interactorOne && !hideDueToPinning;
      uniform.hubs_InteractorOnePos.value[0] = interactorOneTransform[12];
      uniform.hubs_InteractorOnePos.value[1] = interactorOneTransform[13];
      uniform.hubs_InteractorOnePos.value[2] = interactorOneTransform[14];

      uniform.hubs_HighlightInteractorTwo.value = !!interactorTwo && !hideDueToPinning;
      uniform.hubs_InteractorTwoPos.value[0] = interactorTwoTransform[12];
      uniform.hubs_InteractorTwoPos.value[1] = interactorTwoTransform[13];
      uniform.hubs_InteractorTwoPos.value[2] = interactorTwoTransform[14];

      if (interactorOne || interactorTwo || isFrozen) {
        uniform.hubs_Time.value = time;
      }
    }
  }
});
